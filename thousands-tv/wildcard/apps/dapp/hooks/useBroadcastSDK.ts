"use client";
//import Button from '@/components/Button';
//import Settings from '@/components/Settings';
//import { ModalContext } from '@/providers/ModalContext';
//import { UserSettingsContext } from '@/providers/UserSettingsContext';
import { VideoResolutionConfig } from "@/utils/userSettings";
import {
    AmazonIVSBroadcastClient,
    BroadcastClientEvents,
    LocalStageStream,
    Stage,
    StageConnectionState,
} from "amazon-ivs-web-broadcast";
// import sdk, {
//     AmazonIVSBroadcastClient,
//     BroadcastClientEvents,
//     LocalStageStream,
//     Stage,
//     StageConnectionState,
//     SubscribeType,
//     ConnectionState,
//     StageEvents,
//     create,
// } from "amazon-ivs-web-broadcast";
import dynamic from "next/dynamic";
import {
    MutableRefObject,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
//import toast from 'react-hot-toast';

export type BroadcastStateContextType = {
    IVSBroadcastClientRef: MutableRefObject<
        typeof import("amazon-ivs-web-broadcast") | undefined
    >;
    sdkVersionRef: MutableRefObject<string>;
    broadcastClientMounted: boolean;
    broadcastClientRef: MutableRefObject<AmazonIVSBroadcastClient | undefined>;
    // stageEventsRef: any;
    // streamTypeRef: any;
    subscribeTypeRef: any; // MutableRefObject<SubscribeType>;
    connectionState: any; //StageConnectionState;
    isLive: boolean;
    isSupported: boolean;
    streamPending: boolean;
    broadcastStartTimeRef: any;
    broadcastErrors: any[];
    toggleStream: () => Promise<void>;
    stopStream: (client: AmazonIVSBroadcastClient) => Promise<void>;
    startStream: ({
        client,
        streamKey,
        ingestEndpoint,
    }: {
        client: AmazonIVSBroadcastClient;
        streamKey: string;
        ingestEndpoint: string;
    }) => Promise<void>;
    createBroadcastClient: ({
        config,
    }: {
        config: VideoResolutionConfig;
    }) => Promise<AmazonIVSBroadcastClient>;
    destroyBroadcastClient: (client: AmazonIVSBroadcastClient) => Promise<void>;
    restartBroadcastClient: ({
        config,
        ingestEndpoint,
    }: {
        config: VideoResolutionConfig;
        ingestEndpoint: string;
    }) => Promise<AmazonIVSBroadcastClient>;
    createLocalStageStream: (device: any) => Promise<LocalStageStream>;
    createStage: (token: string, strategy: any) => Promise<Stage>;
};

const useBroadcastSDK = () => {
    //const { streamKey, ingestEndpoint } = useContext(UserSettingsContext);
    //const { toggleModal, setModalProps, setModalContent } =
    //useContext(ModalContext);

    const streamKey: string = "";
    const ingestEndpoint: string = "";

    const [broadcastClientMounted, setBroadcastClientMounted] =
        useState<boolean>(false);
    const [isLive, setIsLive] = useState<boolean>(false);
    const [isSupported, setIsSupported] = useState<boolean>(true);
    const [streamPending, setStreamPending] = useState<boolean>(false);
    // connectionState type is StageConnectionState however it will failed due ot client side unable to find browser/self
    const [connectionState, setConnectionState] = useState<any>();
    const [clientErrors, setClientErrors] = useState<any[]>([]);
    const IVSBroadcastClientRef =
        useRef<typeof import("amazon-ivs-web-broadcast")>();
    const broadcastClientRef = useRef<AmazonIVSBroadcastClient>();
    // const stageEventsRef = useRef(undefined);
    // const streamTypeRef = useRef(undefined);
    // const connectionStateRef = useRef<ConnectionState>();
    const subscribeTypeRef = useRef<any>();
    const broadcastClientEventsRef = useRef<typeof BroadcastClientEvents>();
    // const localStageStreamRef = useRef<LocalStageStream>();
    // const stageRef = useRef<typeof Stage>();
    const startTimeRef = useRef<Date>();
    const sdkVersionRef = useRef<string>("");

    const importBroadcastSDK = async () => {
        const sdk = await import("amazon-ivs-web-broadcast");
        broadcastClientEventsRef.current = sdk.BroadcastClientEvents;
        // stageRef.current = (await import("amazon-ivs-web-broadcast")).Stage;
        // localStageStreamRef.current = (
        //     await import("amazon-ivs-web-broadcast")
        // ).LocalStageStream;
        // stageEventsRef.current = (
        //     await import("amazon-ivs-web-broadcast")
        // ).StageEvents;
        // streamTypeRef.current = (
        //     await import("amazon-ivs-web-broadcast")
        // ).StreamType;
        // subscribeTypeRef.current = (
        //     await import("amazon-ivs-web-broadcast")
        // ).SubscribeType;
        // connectionStateRef.current = (
        //     await import("amazon-ivs-web-broadcast")
        // ).ConnectionState;
        subscribeTypeRef.current = sdk.SubscribeType.AUDIO_VIDEO;
        IVSBroadcastClientRef.current = sdk;
        return sdk;
    };

    const createBroadcastClient = async ({
        config: streamConfig,
    }: {
        config: VideoResolutionConfig;
    }) => {
        const IVSBroadcastClient = IVSBroadcastClientRef.current
            ? IVSBroadcastClientRef.current
            : await importBroadcastSDK();

        const client: AmazonIVSBroadcastClient = IVSBroadcastClient.create({
            streamConfig,
        });

        broadcastClientRef.current = client;
        sdkVersionRef.current = IVSBroadcastClient.__version;
        setIsSupported(IVSBroadcastClient.isSupported());
        await attachBroadcastClientListeners(client);

        // TODO: odd hack from ivs
        // Hack to get fix react state update issue
        // setBroadcastClientMounted(new Date());
        setBroadcastClientMounted(true);

        return client;
    };

    const createStage = async (token: string, strategy: any) => {
        const IVSBroadcastClient = IVSBroadcastClientRef.current
            ? IVSBroadcastClientRef.current
            : await importBroadcastSDK();

        return new IVSBroadcastClient.Stage(token, strategy);
        // return new stageRef.current(token, strategy);
    };

    const createLocalStageStream = async (device: any) => {
        const IVSBroadcastClient = IVSBroadcastClientRef.current
            ? IVSBroadcastClientRef.current
            : await importBroadcastSDK();

        return new IVSBroadcastClient.LocalStageStream(device);
        // return new localStageStreamRef.current(device);
    };

    const destroyBroadcastClient = async (client: AmazonIVSBroadcastClient) => {
        await detachBroadcastClientListeners(client);
        client.delete();
        setBroadcastClientMounted(false);
    };

    const attachBroadcastClientListeners = async (client: any) => {
        const IVSBroadcastClient = IVSBroadcastClientRef.current
            ? IVSBroadcastClientRef.current
            : await importBroadcastSDK();

        client.on(
            IVSBroadcastClient.BroadcastClientEvents.CONNECTION_STATE_CHANGE,
            handleConnectionStateChange
        );
        client.on(
            IVSBroadcastClient.BroadcastClientEvents.ACTIVE_STATE_CHANGE,
            handleActiveStateChange
        );
        client.on(
            IVSBroadcastClient.BroadcastClientEvents.ERROR,
            handleClientError
        );
    };

    const detachBroadcastClientListeners = async (client: any) => {
        const IVSBroadcastClient = IVSBroadcastClientRef.current
            ? IVSBroadcastClientRef.current
            : await importBroadcastSDK();

        client.off(
            IVSBroadcastClient.BroadcastClientEvents.CONNECTION_STATE_CHANGE,
            handleConnectionStateChange
        );
        client.off(
            IVSBroadcastClient.BroadcastClientEvents.ACTIVE_STATE_CHANGE,
            handleActiveStateChange
        );
        client.off(
            IVSBroadcastClient.BroadcastClientEvents.ERROR,
            handleClientError
        );
    };

    const restartBroadcastClient = async ({
        config,
        ingestEndpoint,
    }: {
        config: VideoResolutionConfig;
        ingestEndpoint: string;
    }) => {
        if (broadcastClientRef && broadcastClientRef.current) {
            if (isLive) {
                await stopStream(broadcastClientRef.current);
            }
            await destroyBroadcastClient(broadcastClientRef.current);
        }

        const newClient = await createBroadcastClient({
            config,
        });

        return newClient;
    };

    const handleActiveStateChange = (active: boolean) => {
        setIsLive(active);
    };

    const handleConnectionStateChange = (state: StageConnectionState) => {
        setConnectionState(state);
    };

    const handleClientError = (clientError: any) => {
        setClientErrors((prevState) => [...prevState, clientError]);
    };

    const stopStream = async (client: AmazonIVSBroadcastClient) => {
        try {
            setStreamPending(true);
            //toast.loading('Stopping stream...', { id: 'STREAM_STATUS' });
            await client.stopBroadcast();
            startTimeRef.current = undefined;
            //toast.success('Stopped stream', { id: 'STREAM_STATUS' });
        } catch (err) {
            console.error(err);
            /*toast.error('Failed to stop stream', {
                id: 'STREAM_STATUS',
            });*/
        } finally {
            setStreamPending(false);
            //toast.remove('STREAM_TIMEOUT');
        }
    };

    const startStream = async ({
        client,
        streamKey,
        ingestEndpoint,
    }: {
        client: AmazonIVSBroadcastClient;
        streamKey: string;
        ingestEndpoint: string;
    }) => {
        // var streamTimeout: ReturnType<typeof setTimeout>;

        try {
            setStreamPending(true);
            await client.startBroadcast(streamKey, ingestEndpoint);
            // clearTimeout(streamTimeout);
            startTimeRef.current = new Date();
        } catch (err: any) {
            // clearTimeout(streamTimeout);
            console.error(err);

            if (err.code === 18000) {
                // Stream key invalid error
                // See: https://aws.github.io/amazon-ivs-web-broadcast/docs/v1.3.1/sdk-reference/namespaces/Errors?_highlight=streamkeyinvalidcharerror#stream_key_invalid_char_error
                console.log("key invalid error");
            } else {
                console.log("Failed to start str");
            }
        } finally {
            setStreamPending(false);
        }
    };

    const toggleStream = async () => {
        if (isLive) {
            if (broadcastClientRef && broadcastClientRef.current) {
                await stopStream(broadcastClientRef.current);
            }
        } else {
            if (broadcastClientRef && broadcastClientRef.current) {
                await startStream({
                    client: broadcastClientRef.current,
                    streamKey,
                    ingestEndpoint,
                });
            }
        }
    };

    return {
        IVSBroadcastClientRef,
        sdkVersionRef,
        broadcastClientMounted,
        broadcastClientRef,
        // stageEventsRef,
        // streamTypeRef,
        subscribeTypeRef,
        // connectionStateRef,
        connectionState,
        isLive,
        isSupported,
        streamPending,
        broadcastStartTimeRef: startTimeRef,
        broadcastErrors: clientErrors,
        toggleStream,
        stopStream,
        startStream,
        createBroadcastClient,
        destroyBroadcastClient,
        restartBroadcastClient,
        createLocalStageStream,
        createStage,
    } as BroadcastStateContextType;
};

export default useBroadcastSDK;
