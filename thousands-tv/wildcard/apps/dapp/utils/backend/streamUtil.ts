import {
    BADGE_MULTIPILIER_TYPE,
    REAL_TIME_STREAM_ROUTE,
} from "@/constants/stream";
import { diContainer } from "@/inversify.config";
import IStreamRepository from "@/repositories/interfaces/iStreamRepository";
import { ChannelEntity } from "@pubnub/react-chat-components";
import {
    ChatApp,
    IBadge,
    ICollectible,
    IUser,
    UserRole,
} from "@repo/interfaces";
import {
    ClaimedTicketDoc,
    StageDoc,
    findBadgesByQuery,
    findCollectiblesByQuery,
    findOneEventByQuery,
} from "@repo/schemas";
import { ObjectCustom, GrantTokenPermissions } from "pubnub";
import { getPubnubSecretKey } from "../environmentUtilWCA";
import { getPubnubInstance } from "./pubnubUtil";
import { AuthorizedUserData } from "./sessionServerUtil";
import {
    CreateParticipantTokenCommand,
    CreateParticipantTokenCommandInput,
    CreateParticipantTokenCommandOutput,
    IVSRealTimeClient,
} from "@aws-sdk/client-ivs-realtime";
import { RealTimeStreamPageProps } from "@/pages/[serverCode]/realtimestream/[streamId]";
import { StreamPageProps } from "@/pages/[serverCode]/stream/[streamId]";
import { GetServerSidePropsResult } from "next";
import IClaimedTicketRepository from "@/repositories/interfaces/iClaimedTicketRepository";
import { getActivePfpUrl } from "@repo/utils";
import { getUserProviderPicture } from "../userUtil";

/**
 * Get server side props result
 * @param authorizedUserData - IUser object and other user related data
 * @param streamId - stream unique id
 * @param isRealtimeStream - specifies whether stream is live or not
 * @returns server side props result
 */
export async function getStreamPageProps(
    authorizedUserData: AuthorizedUserData,
    streamId: string,
    isRealtimeStream: boolean
): Promise<
    GetServerSidePropsResult<RealTimeStreamPageProps | StreamPageProps>
> {
    let event: StageDoc | null;
    let badges: IBadge[] = [];
    let collectibles: ICollectible[] = [];
    let streamBroadcastToken: string = "";
    let claimedTicket: ClaimedTicketDoc | null = null;

    const { userDB, connectedUserDBProviderId, connectedUserDBEmail } =
        authorizedUserData;

    if (!userDB || !userDB?._id) {
        return {
            redirect: {
                destination: "/login",
                permanent: false,
            },
        };
    }

    // Lookup stream
    const streamRepository: IStreamRepository =
        diContainer.get("IStreamRepository");
    const stream = await streamRepository.findStreamById(streamId);
    const playbackUrl = stream?.channelPlaybackUrl?.toString() ?? "";

    // Check if stream exist
    if (!stream) {
        console.error(`Unable to find stream: ${streamId}.`);
        return {
            redirect: {
                destination: "/events",
                permanent: false,
            },
        };
    }

    const userId = userDB._id.toString();
    const stageId = stream.stageId.toString();
    const vendorEventId = stream.vendorEventId.toString();
    const streamName = stream.name.toString();

    // Gather all the promises
    const claimedTicketRepository: IClaimedTicketRepository = diContainer.get(
        "IClaimedTicketRepository"
    );
    const claimedTicketPromise =
        claimedTicketRepository.getClaimedTicketByUserAndEvent(userId, stageId);
    const unsortedBadgesPromise = findBadgesByQuery({});
    const collectiblesPromise = findCollectiblesByQuery({});
    const eventPromise = findOneEventByQuery({
        beamableEventId: vendorEventId,
    });

    // viewer stream
    if (!isRealtimeStream) {
        [claimedTicket, event, badges, collectibles] = await Promise.all([
            claimedTicketPromise,
            eventPromise,
            unsortedBadgesPromise,
            collectiblesPromise,
        ]);

        // Check if the have a ticket, if not, send them back to /events
        if (!claimedTicket) {
            console.error(
                `Failed to find claimed ticket for stream/stage: ${streamId}/${stageId}`
            );
            return {
                redirect: {
                    destination: "/events",
                    permanent: false,
                },
            };
        }

        badges = badges.filter((badge) => {
            return (
                BADGE_MULTIPILIER_TYPE.includes(badge.type) &&
                badge.userIds.includes(userDB?._id?.toString() || "")
            );
        });
    } else {
        // live stream
        let createParticipantToken: CreateParticipantTokenCommandOutput;

        const realTimeClient = new IVSRealTimeClient();
        const createParticipantTokenCommandInput: CreateParticipantTokenCommandInput =
            {
                // CreateParticipantTokenRequest
                stageArn: stream.stageArn?.toString(), // required
                duration: 240,
                userId: userId,
                attributes: {},
                capabilities: ["PUBLISH", "SUBSCRIBE"],
            };
        const createParticipantTokenCommand = new CreateParticipantTokenCommand(
            createParticipantTokenCommandInput
        );
        const createParticipantTokenPromise = realTimeClient.send(
            createParticipantTokenCommand
        );

        [event, createParticipantToken] = await Promise.all([
            eventPromise,
            createParticipantTokenPromise,
        ]);

        streamBroadcastToken =
            createParticipantToken?.participantToken?.token ?? "";
    }

    // Check if event exists
    if (!event) {
        console.error(`Unable to find event: ${stream.vendorEventId}.`);
        return {
            redirect: {
                destination: "/events",
                permanent: false,
            },
        };
    }

    const numberOfSkyboxes = event.numberOfSkyboxes ?? 0;
    const channels: ChannelEntity[] = event.channels.map((channel) => {
        return {
            id: `g.${event._id.toString()}.${channel._id}`,
            name: channel.name,
            custom: {
                profileUrl: `/images/${channel.src}.svg`,
            } as ObjectCustom,
        } as ChannelEntity;
    });

    // add signal message channel to receive more than 64 bytes
    const signalMessageChannel = {
        id: `s.${event._id.toString()}`,
        name: "Signal Messages",
    } as ChannelEntity;
    const signalDirectMessageChannel = {
        id: `u.${userDB?._id?.toString()}`,
        name: "Direct Messages",
    } as ChannelEntity;
    channels.push(signalMessageChannel, signalDirectMessageChannel);

    const channelIds = channels.map((channel) => channel.id);

    // @todo default channel set to first channel
    // but need special logic to delegate different channel once it gets "full"
    const activeChannel: ChannelEntity = channels[0];
    const secretKey = getPubnubSecretKey();
    const pubnub = getPubnubInstance(userId, secretKey);
    const channelPermissions = getChannelPermissions(channels, stageId, userDB);

    // create direct message channel at user level
    await pubnub.objects.setChannelMetadata({
        channel: signalDirectMessageChannel.id,
        data: {
            name: signalDirectMessageChannel.name as string,
        },
    });

    // Previously batch promises but got Pubnub bad request error
    // Many contributing factors involved including setChannelMetadata
    // Let keep promise sequential and continue observation
    const pubnubToken = await pubnub.grantToken({
        ttl: 180,
        authorized_uuid: userId,
        resources: {
            channels: channelPermissions,
            uuids: {
                [userId]: {
                    update: true,
                    delete: userDB.roles.includes(UserRole.MODERATOR),
                    get: true,
                },
            },
        },
        patterns: {
            uuids: {
                ".*": {
                    get: true,
                },
            },
            channels: {
                "PUBNUB_INTERNAL_.*": {
                    read: true,
                    write: true,
                    update: true,
                    join: true,
                    get: true,
                    delete: userDB.roles.includes(UserRole.MODERATOR),
                },
                ".*": {
                    read: true,
                },
            },
        },
    });

    // adds user to channel retry mechanism for profile metadata discrepancy
    const membershipSuccess = await setPubnubMembershipsWithRetry(
        pubnub,
        userId,
        channelIds,
        userDB
    );

    if (!membershipSuccess) {
        console.error(`Failed to set PubNub memberships for user ${userId}`);
    }

    return {
        props: {
            userDBStr: JSON.stringify(userDB),
            streamPlaybackUrl: playbackUrl,
            streamId,
            eventId: stageId,
            vendorEventId,
            streamName,
            badgesStr: JSON.stringify(badges),
            collectiblesStr: JSON.stringify(collectibles),
            streamBroadcastToken,
            channelsStr: JSON.stringify(channels),
            activeChannelStr: JSON.stringify(activeChannel),
            connectedUserDBEmail: connectedUserDBEmail || "",
            connectedUserDBProviderId: connectedUserDBProviderId || "",
            pubnubToken: pubnubToken,
            ticketTier: claimedTicket?.tier,
            chatApp: stream.chatApp || ChatApp.WILDCARD,
            numberOfSkyboxes,
        },
    };
}

/**
 * Check if stream is live or not
 * @param url - url of the stream
 * @returns whether the stream is live or not
 */
export function isStreamRealtime(url: string): boolean {
    return url.includes(REAL_TIME_STREAM_ROUTE);
}

export function getChannelPermissions(
    channels: ChannelEntity[],
    eventId: string,
    userDB: IUser
): {
    [key: string]: GrantTokenPermissions;
} {
    const channelPermissions = channels.reduce(
        (map, channel: ChannelEntity) => {
            // map[`${channel.id}-pnpres`] = {
            //     read: true,
            //     write: true,
            //     update: true,
            //     join: true,
            //     get: true,
            // };
            map[`${channel.id}`] = {
                read: true,
                write: true,
                update: true,
                join: true,
                get: true,
                delete: true,
            };
            return map;
        },
        {} as { [key: string]: GrantTokenPermissions }
    );

    const systemChannelPermissions: {
        [key: string]: GrantTokenPermissions;
    } = {
        // [`group.${eventId}.system-pnpres`]: {
        //     read: true,
        //     get: true,
        //     join: true,
        // },
        [`group.${eventId}.system`]: {
            read: true,
            get: true,
            join: true,
        },
    };
    return { ...channelPermissions, ...systemChannelPermissions };
}

/**
 * Attempts to set PubNub memberships with a single retry mechanism
 * @param pubnub - PubNub instance
 * @docs - https://www.pubnub.com/docs/chat/sdks/channels/memberships
 * @param userId - User ID to set memberships for
 * @param channelIds - Array of channel IDs to set membership for
 * @param userDB - User
 * @returns Promise<boolean> indicating if the operation was successful
 */
export async function setPubnubMembershipsWithRetry(
    pubnub: any,
    userId: string,
    channelIds: string[],
    userDB: IUser
): Promise<boolean> {
    let retryCount = 0;
    const maxRetries = 1;

    const attempt = async (): Promise<boolean> => {
        try {
            await pubnub.objects.setMemberships({
                uuid: userId,
                channels: channelIds,
            });
            return true;
        } catch (error: any) {
            console.error(
                `PubNub setMemberships failed to set memberships for user ${userId}. Attempting retry...`,
                error
            );

            if (retryCount < maxRetries) {
                retryCount++;

                // Try to ensure user exists by setting basic metadata
                const metadataSuccess = await setProfileMetadata(
                    pubnub,
                    userId,
                    userDB
                );

                if (metadataSuccess) {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    return attempt();
                }
            }

            return false;
        }
    };

    return attempt();
}

/**
 * Sets or updates a user's PubNub profile metadata
 * @param pubnub - PubNub instance
 * @param userId - User ID to set metadata for
 * @param foundUser - User object containing profile information
 * @returns Promise<boolean> indicating if the operation was successful
 * @throws Will return false if user is not found or display name is invalid
 */
export async function setProfileMetadata(
    pubnub: any,
    userId: string,
    foundUser: IUser | null
): Promise<boolean> {
    if (!foundUser) {
        console.error(`Unable to find user for PubNub update: ${userId}`);
        return false;
    }

    const displayName = foundUser?.preferences?.displayName;

    if (!displayName || displayName.trim().length === 0) {
        console.error(`Unable to find valid display name for user: ${userId}`);
        return false;
    }

    let pfpImageUrl = getActivePfpUrl(foundUser);
    if (!pfpImageUrl || pfpImageUrl === "") {
        pfpImageUrl = getUserProviderPicture(foundUser);
    }

    try {
        const result = await pubnub.objects.setUUIDMetadata({
            data: {
                name: displayName.trim(),
                profileUrl: pfpImageUrl,
                custom: {},
            },
        });

        if (result) {
            console.log(`Successfully set PubNub metadata for user ${userId}`);
            return true;
        }
        console.error(`Failed to set PubNub metadata for user ${userId}`);
        return false;
    } catch (error) {
        console.error(
            `Error setting PubNub metadata for user ${userId}:`,
            error
        );
        return false;
    }
}
