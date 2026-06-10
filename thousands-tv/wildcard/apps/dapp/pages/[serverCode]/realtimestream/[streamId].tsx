import React, { useEffect, useState } from "react";
import BroadcastProvider from "@/contexts/broadcastContext";
import LocalMediaProvider from "@/contexts/localMediaContext";
import { GetServerSideProps } from "next";
import RealTimeStream from "@/features/RealTimeStream";
import { AuthorizedUserData } from "@/utils/backend/sessionServerUtil";
import StreamLayout from "@/layouts/StreamLayout";
import UserSettingsProvider from "@/contexts/userSettingsContext";
import PubNub from "pubnub";
import StreamControlProvider from "@/contexts/streamControlsContext";
import IdleControlProvider from "@/contexts/chatAppIdleGameContext";
import StreamProvider from "@/contexts/streamContext";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { PubNubProvider } from "pubnub-react";
import { getPubnubInstance } from "@/utils/backend/pubnubUtil";
import { ChatApp, IUser } from "@repo/interfaces";
import connectToDb from "@/db/connectToDb";
import {
    getStreamPageProps,
    isStreamRealtime,
} from "@/utils/backend/streamUtil";
import { checkUserAuthorizedForPage } from "@/utils/profileUtil";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Portal } from "@chakra-ui/react";

export interface RealTimeStreamPageProps {
    userDBStr: string;
    streamPlaybackUrl: string;
    streamId: string;
    eventId: string;
    vendorEventId: string;
    streamName: string;
    streamBroadcastToken: string;
    channelsStr: string;
    activeChannelStr: string;
    connectedUserDBEmail: string;
    connectedUserDBProviderId: string;
    pubnubToken: string;
    chatApp: ChatApp;
}

const RealTimeStreamPage = ({
    userDBStr,
    streamPlaybackUrl,
    streamId,
    eventId,
    vendorEventId,
    streamName,
    streamBroadcastToken,
    channelsStr,
    activeChannelStr,
    connectedUserDBEmail,
    connectedUserDBProviderId,
    pubnubToken,
    chatApp,
}: RealTimeStreamPageProps) => {
    const userDBFormatted: IUser = JSON.parse(userDBStr);
    const channels = JSON.parse(channelsStr);
    const formattedActiveChannel = JSON.parse(activeChannelStr);

    const { setUserDB, setConnectedUserDBProviderId, setConnectedUserDBEmail } =
        useWildfileUserContext();

    const [pubnub, setPubnub] = useState<PubNub | null>(null);

    // Use useEffect to mount updated userDB and other instances
    useEffect(() => {
        setUserDB(userDBFormatted);
        setConnectedUserDBProviderId(connectedUserDBProviderId);
        setConnectedUserDBEmail(connectedUserDBEmail);

        const pubnubInstance = getPubnubInstance(
            userDBFormatted._id!.toString()
        );

        pubnubInstance.setToken(pubnubToken);
        setPubnub(pubnubInstance);
    }, []);

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
        <UserSettingsProvider>
            <LocalMediaProvider>
                <BroadcastProvider>
                    <PubNubProvider client={pubnub}>
                        <StreamProvider
                            userDB={userDBFormatted}
                            streamId={streamId}
                            eventId={eventId}
                            vendorEventId={vendorEventId}
                            streamName={streamName}
                            streamPlaybackUrl={streamPlaybackUrl}
                            channels={channels}
                            formattedActiveChannel={formattedActiveChannel}
                            ticketTier=""
                            chatApp={chatApp}
                        >
                            <StreamControlProvider>
                                {/* <IdleControlProvider> */}
                                <StreamLayout>
                                    <RealTimeStream
                                        streamBroadcastToken={
                                            streamBroadcastToken
                                        }
                                    />
                                </StreamLayout>
                                {/* </IdleControlProvider> */}
                            </StreamControlProvider>
                        </StreamProvider>
                    </PubNubProvider>
                </BroadcastProvider>
            </LocalMediaProvider>
        </UserSettingsProvider>
    );
};

export const getServerSideProps: GetServerSideProps<
    | RealTimeStreamPageProps
    | { redirect: { destination: string; permanent: boolean } }
> = async (context) => {
    const streamId = context?.params?.streamId as string;
    const isLiveStream = isStreamRealtime(context.resolvedUrl);

    const userAuthorizedForPageResult = await checkUserAuthorizedForPage(
        context
    );

    if (!userAuthorizedForPageResult.success) {
        // redirect the user if they are not authorized
        return userAuthorizedForPageResult.data as {
            redirect: { destination: string; permanent: boolean };
        };
    }

    try {
        await connectToDb();

        const authorizedUserData: AuthorizedUserData =
            userAuthorizedForPageResult.data as AuthorizedUserData;
        const propsResult = (await getStreamPageProps(
            authorizedUserData,
            streamId,
            isLiveStream
        )) as { props: RealTimeStreamPageProps };
        return propsResult;
    } catch (e) {
        console.error("Error fetching real time stream backend info:", e);
        return {
            redirect: {
                destination: "/events",
                permanent: false,
            },
        };
    }
};

export default RealTimeStreamPage;
