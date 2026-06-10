"use client";

import { useEffect, useRef, useState } from "react";
import connectToDb from "@/db/connectToDb";
import Stream from "@/features/Stream";
import { GetServerSideProps } from "next";
import LocalMediaProvider from "@/contexts/localMediaContext";
import { AuthorizedUserData } from "@/utils/backend/sessionServerUtil";
import StreamLayout from "@/layouts/StreamLayout";
import {
    ChatApp,
    IBadge,
    ICollectible,
    ISkybox,
    IUser,
} from "@repo/interfaces";
import { ChannelEntity } from "@pubnub/react-chat-components";
import StreamControlProvider from "@/contexts/streamControlsContext";
import IdleControlProvider from "@/contexts/chatAppIdleGameContext";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import StreamProvider from "@/contexts/streamContext";
import { getPubnubChatInstance } from "@/utils/backend/pubnubUtil";
import {
    getStreamPageProps,
    isStreamRealtime,
} from "@/utils/backend/streamUtil";
import { useGlobalContext } from "@/contexts/globalContext";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Portal } from "@chakra-ui/react";
import { checkUserAuthorizedForPage } from "@/utils/profileUtil";
import { Chat } from "@pubnub/chat";
import UserMetaProvider from "@/contexts/userMetaContext";
import StreamScoreProvider from "@/contexts/streamScoreComponentContext";
import { useBoostStore } from "@/store/useBoostStore";
import ErrorBoundary from "@/components/ErrorBoundary";
import usePubnubStore from "@/store/usePubnubStore";
import { useSkyboxStore } from "@/store/useSkyboxStore";
import { Types } from "mongoose";
import { SkyboxFan } from "@/features/Skybox/types";

export interface StreamPageProps {
    userDBStr: string;
    streamPlaybackUrl: string;
    streamId: string;
    eventId: string;
    vendorEventId: string;
    streamName: string;
    badgesStr: string;
    collectiblesStr: string;
    channelsStr: string;
    activeChannelStr: string;
    connectedUserDBEmail: string;
    connectedUserDBProviderId: string;
    pubnubToken: string;
    ticketTier: string;
    chatApp: ChatApp;
    numberOfSkyboxes: number;
}

const StreamPage = ({
    userDBStr,
    streamPlaybackUrl,
    streamId,
    eventId,
    vendorEventId,
    streamName,
    badgesStr,
    collectiblesStr,
    channelsStr,
    activeChannelStr,
    connectedUserDBEmail,
    connectedUserDBProviderId,
    pubnubToken,
    ticketTier,
    chatApp,
    numberOfSkyboxes,
}: StreamPageProps) => {
    const userDBFormatted: IUser = JSON.parse(userDBStr);
    const channels: ChannelEntity[] = JSON.parse(channelsStr);
    const formattedActiveChannel: ChannelEntity = JSON.parse(activeChannelStr);
    //const [pubnub, setPubnub] = useState<Chat | null>(null);

    const { setUserDB, setConnectedUserDBProviderId, setConnectedUserDBEmail } =
        useWildfileUserContext();
    const {
        redBoostProgress,
        setRedBoostLevel,
        setRedBoostProgressToNextLevel,
        setRedPersonalProgressStartTime,
        redPersonalProgressStartTime,
        blueBoostProgress,
        setBlueBoostLevel,
        setBlueBoostProgressToNextLevel,
        setBluePersonalProgressStartTime,
        bluePersonalProgressStartTime,
        dateTimeOffset,
        updateButtonState,
        eventMatchStartTime,
        totalRedBoost,
        totalBlueBoost,
        updateComboMultiplier,
    } = useBoostStore();

    const {
        activeChannel,
        setActiveChannel,
        setGeneralChannel,
        pubnub,
        setPubNub,
    } = usePubnubStore();
    const setGeneralSkybox = useSkyboxStore((state) => state.setGeneralSkybox);
    const setIsSkyboxesVisible = useSkyboxStore(
        (state) => state.setIsSkyboxesVisible
    );

    const initializePubNub = async () => {
        try {
            setUserDB(userDBFormatted);
            setConnectedUserDBProviderId(connectedUserDBProviderId);
            setConnectedUserDBEmail(connectedUserDBEmail);
            const pubnubInstance = await getPubnubChatInstance(
                userDBFormatted._id!.toString(),
                pubnubToken
            );
            setPubNub(pubnubInstance);

            if (!formattedActiveChannel.id) {
                console.error("Channel id is undefined or null");
                return null;
            }

            try {
                const channel = await pubnubInstance.getChannel(
                    formattedActiveChannel.id
                );

                if (!channel) {
                    console.log(
                        `Unable to fetch channel ${formattedActiveChannel.id}`
                    );
                    return;
                }

                setActiveChannel(channel);
                setGeneralChannel(channel);

                const formattedGeneralId = formattedActiveChannel.id.slice(
                    `g.${eventId}.`.length
                );
                setGeneralSkybox({
                    skyboxName: channel!.name,
                    skyboxPrimaryColor: "gold",
                    skyboxLogoUrl:
                        "/images/ServerNavigation/thousandsservercircle.svg",
                    skyboxChannelMembers: [] as string[],
                    stageId: new Types.ObjectId(eventId),
                    _id: new Types.ObjectId(formattedGeneralId),
                    // @note need a owner or make it optional
                    ownerUserId: new Types.ObjectId(),
                    createdAt: new Date(),
                } as ISkybox);
            } catch (e: any) {
                console.error(
                    `Error failed to fetch channel ${formattedActiveChannel.id}`,
                    e
                );
            }
        } catch (error) {
            console.error("Error initializing PubNub:", error);
        }
    };

    // Use useEffect to mount updated userDB and other instances
    useEffect(() => {
        initializePubNub();
        setIsSkyboxesVisible(!!numberOfSkyboxes);
    }, []);

    /*
    const updateButtonState = (boostType: string, boostProgress: number, dateTimeOffset: number, personalProgressStartTime: number) => {
        //Calculate the adjusted front end time using the dateTimeOffset (which is the difference between client and server)
        const frontendTimestamp = Date.now() + dateTimeOffset;

        //This is temporary until we get the "join" setting the initial values
        if (personalProgressStartTime < 1) {
            personalProgressStartTime = frontendTimestamp;
            if (boostType === "red") {
                setRedPersonalProgressStartTime(personalProgressStartTime);
            } else {
                setBluePersonalProgressStartTime(personalProgressStartTime);
            }
        }

        //Set adjustedBoostProgress to the decayed value by using the time since personalProgressStartTime.  We multiply time by 0.0001 because time is in ms.
        let adjustedBoostProgress =
            boostProgress -
            ((frontendTimestamp - personalProgressStartTime) * 0.001);

        console.log(adjustedBoostProgress + " = " + boostProgress + " - ( " + frontendTimestamp + " - " + personalProgressStartTime + " )");

        //adjustedBoostProgress can't go less than zero
        if (adjustedBoostProgress < 0) {
            adjustedBoostProgress = 0;
        }
        //Calculate the level by dividing by 100.  Add 1 because level is 1 based.
        var adjustedPersonalBoostLevel =
            Math.floor(adjustedBoostProgress / 100.0) + 1;
        //Cap the level at 4
        if (adjustedPersonalBoostLevel > 4) {
            adjustedPersonalBoostLevel = 4;
        }
        //Calculate the boost progress to next level using the remainder using % 100
        const adjustedBoostProgressToNextLevel = Math.round(
            adjustedBoostProgress % 100
        );

        if (boostType === "red") {
            setRedBoostLevel(adjustedPersonalBoostLevel);
            setRedBoostProgressToNextLevel(adjustedBoostProgressToNextLevel);
        }
        else {
            setBlueBoostLevel(adjustedPersonalBoostLevel);
            setBlueBoostProgressToNextLevel(adjustedBoostProgressToNextLevel);
        }

        console.log(
            "redboost decay",
            adjustedPersonalBoostLevel,
            adjustedBoostProgressToNextLevel
        );
    };
    */

    if (!pubnub) {
        return (
            <StreamLayout>
                <Portal>
                    <LoadingOverlay message={`Loading ${streamName}...`} />
                </Portal>
            </StreamLayout>
        );
    }

    return (
        <ErrorBoundary>
            <UserMetaProvider pubnub={pubnub}>
                <LocalMediaProvider>
                    <StreamProvider
                        userDB={userDBFormatted}
                        streamId={streamId}
                        eventId={eventId}
                        vendorEventId={vendorEventId}
                        streamName={streamName}
                        streamPlaybackUrl={streamPlaybackUrl}
                        channels={channels}
                        formattedActiveChannel={formattedActiveChannel}
                        chatSdk={true}
                        ticketTier={ticketTier}
                        chatApp={chatApp}
                    >
                        <StreamControlProvider>
                            <StreamScoreProvider>
                                <StreamLayout>
                                    <Stream />
                                </StreamLayout>
                            </StreamScoreProvider>
                        </StreamControlProvider>
                    </StreamProvider>
                </LocalMediaProvider>
            </UserMetaProvider>
        </ErrorBoundary>
    );
};

export const getServerSideProps: GetServerSideProps<
    StreamPageProps | { redirect: { destination: string; permanent: boolean } }
> = async (context) => {
    const totalStartTime = Date.now();
    // Cookies
    const serverCode = context?.params?.serverCode as string;
    const streamId = context?.params?.streamId as string;
    const isLiveStream = isStreamRealtime(context.resolvedUrl);
    console.log(`[PERF] Stream getServerSideProps - START for streamId: ${streamId}`);

    const authCheckStart = Date.now();
    const userAuthorizedForPageResult = await checkUserAuthorizedForPage(
        context
    );
    console.log(`[PERF] checkUserAuthorizedForPage took: ${Date.now() - authCheckStart}ms`);

    if (!userAuthorizedForPageResult.success) {
        // redirect the user if they are not authorized
        return userAuthorizedForPageResult.data as {
            redirect: { destination: string; permanent: boolean };
        };
    }

    try {
        const dbConnectStart = Date.now();
        await connectToDb();
        console.log(`[PERF] connectToDb took: ${Date.now() - dbConnectStart}ms`);

        const authorizedUserData: AuthorizedUserData =
            userAuthorizedForPageResult.data as AuthorizedUserData;
        
        const streamPropsStart = Date.now();
        const propsResult = (await getStreamPageProps(
            authorizedUserData,
            streamId,
            isLiveStream
        )) as { props: StreamPageProps };
        console.log(`[PERF] getStreamPageProps took: ${Date.now() - streamPropsStart}ms`);
        
        console.log(`[PERF] Stream getServerSideProps - TOTAL: ${Date.now() - totalStartTime}ms`);
        return propsResult;
    } catch (e) {
        console.error("Error fetching stream backend info:", e);
        return {
            redirect: {
                destination: `/${serverCode}/events`,
                permanent: false,
            },
        };
    }
};

export default StreamPage;
