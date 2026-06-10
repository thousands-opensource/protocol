"use client";

import React, { useContext, useEffect, useRef, useState } from "react";
import { BroadcastContext } from "@/contexts/broadcastContext";
import { LocalMediaContext } from "@/contexts/localMediaContext";
import { UserSettingsContext } from "@/contexts/userSettingsContext";
import { Box } from "@chakra-ui/react";
import { useStreamControlContext } from "@/contexts/streamControlsContext";
import useLocalStorage from "@/hooks/useLocalStorage";
import {
    AmazonIVSBroadcastClient,
    LocalStageStream,
    RemoteStageStream,
    StageEvents,
    StageParticipantInfo,
    StageStrategy,
    StageStream,
} from "amazon-ivs-web-broadcast";
import { VideoResolutionConfig } from "@/utils/userSettings";
import { useStreamContext } from "@/contexts/streamContext";

interface VideoBroadcastProps {
    streamBroadcastToken: string;
}

const VideoBroadcast = ({ streamBroadcastToken }: VideoBroadcastProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const video2Ref = useRef<HTMLVideoElement>(null);
    const videoStreamsContainerRef = useRef<HTMLDivElement>(null);
    let stage: any;
    let joining = false;
    let connected = false;
    let localCamera;
    let localMic;
    let cameraStageStream: any;
    let micStageStream: any;
    let remoteStreams = [];

    const {
        isLive,
        isSupported,
        broadcastClientRef,
        // stageEventsRef,
        // streamTypeRef,
        subscribeTypeRef,
        // connectionStateRef,
        createStage,
        createLocalStageStream,
        createBroadcastClient,
        destroyBroadcastClient,
        IVSBroadcastClientRef,
        broadcastClientMounted,
    } = useContext(BroadcastContext);
    const { configRef, ingestEndpoint, setIngestEndpoint, setStreamKey } =
        useContext(UserSettingsContext);
    const {
        setInitialDevices,
        // localVideoDeviceId,
        // localVideoStreamRef,
        // canvasElemRef,
        cleanUpDevices,
        // enableCanvasCamera,
        // refreshSceneRef,
        strategy,
    } = useContext(LocalMediaContext);

    const { setStage } = useStreamContext();

    const previewRef = useRef(undefined);
    const sdkIsStarting = useRef(false);
    const [canvasWidth, setCanvasWidth] = useState();
    const [canvasHeight, setCanvasHeight] = useState();
    const [videoStream, setVideoStream] = useState();

    const getParticipantVideoElement = (participantId: string) => {
        let e = document.getElementById("video-element-" + participantId);
        if (e != null) {
            if (!(e instanceof HTMLVideoElement)) {
                throw new Error(
                    `getParticipantVideoElement expected HTMLVideoElement type, was ${
                        (e && e.constructor && e.constructor.name) || e
                    }`
                );
            }
        }
        let videoElement: HTMLVideoElement | null = e;

        if (videoElement == null) {
            videoElement = document.createElement("video");
            videoElement.id = "video-element-" + participantId;
            videoElement.autoplay = true;
            videoElement.playsInline = true;
            videoElement.style["width"] = "50%";
            videoElement.style["height"] = "50%";
            videoElement.style["float"] = "left";
            videoElement.style["padding"] = "10px";

            videoStreamsContainerRef.current?.appendChild(videoElement);
        }

        return videoElement;
    };

    const joinStage = async (
        videoStream: MediaStream,
        audioStream: MediaStream
    ) => {
        try {
            if (connected || joining) {
                return;
            }
            joining = true;

            if (!streamBroadcastToken) {
                console.log("Please enter a participant token");
                joining = false;
                return;
            }

            let cameraStageStream: LocalStageStream | null = null;
            let micStageStream: LocalStageStream | null = null;
            if (videoStream) {
                cameraStageStream = await createLocalStageStream(
                    videoStream.getTracks()[0]
                );
            }

            if (audioStream) {
                micStageStream = await createLocalStageStream(
                    audioStream.getTracks()[0]
                );
            }

            strategy.updateTracks(cameraStageStream, micStageStream);
            stage = await createStage(streamBroadcastToken, strategy);
            setStage(stage);

            //console.log(stage);
            //console.log(broadcastClientRef.current);

            stage.on(
                IVSBroadcastClientRef.current?.StageEvents
                    .STAGE_CONNECTION_STATE_CHANGED,
                (state: any) => {
                    console.log("Connection state changed:", state);

                    connected =
                        state ===
                        IVSBroadcastClientRef.current?.ConnectionState
                            .CONNECTED;

                    if (connected) {
                        joining = false;
                    }
                }
            );

            stage.on(
                IVSBroadcastClientRef.current?.StageEvents
                    .STAGE_PARTICIPANT_JOINED,
                (participant: StageParticipantInfo) => {
                    console.log("Participant Joined:", participant);
                }
            );

            stage.on(
                IVSBroadcastClientRef.current?.StageEvents
                    .STAGE_PARTICIPANT_STREAMS_ADDED,
                (
                    participant: StageParticipantInfo,
                    streams: StageStream<any>[]
                ) => {
                    console.log("Participant Stream Added", participant);

                    let streamsToDisplay = streams;

                    //If this is yourself, don't loopback your audio
                    if (participant.isLocal) {
                        streamsToDisplay = streams.filter(
                            (stream) => stream.streamType === "video"
                        );
                    }

                    if (videoStreamsContainerRef.current) {
                        // Create or find video element already available in your application
                        const videoEl = getParticipantVideoElement(
                            participant.id
                        );

                        // Attach the participants streams
                        const videoStream = new MediaStream();
                        streamsToDisplay.forEach((stream) =>
                            videoStream.addTrack(stream.mediaStreamTrack)
                        );
                        videoEl.srcObject = videoStream;
                    } else {
                        console.log("cant find videoStreamsContainerRef");
                    }
                }
            );

            performance.mark("join");
            await stage.join();
        } catch (err: any) {
            joining = false;
            connected = false;
            console.error(err.message);
        }
    };

    const leaveStage = async () => {
        stage.leave();

        joining = false;
        connected = false;
    };

    useEffect(() => {
        if (sdkIsStarting.current) return;
        sdkIsStarting.current = true;
        setInitialDevices().then(
            ({ audioDeviceId, audioStream, videoDeviceId, videoStream }) => {
                console.log("audio", audioDeviceId, audioStream);
                console.log("video", videoDeviceId, videoStream);
                if (!broadcastClientRef.current) {
                    createBroadcastClient({
                        config: configRef.current as VideoResolutionConfig,
                    }).then((client: AmazonIVSBroadcastClient) => {
                        if (videoStream != null) {
                            const { width, height } = videoStream
                                .getTracks()[0]
                                .getSettings();
                        }

                        joinStage(videoStream, audioStream);

                        //refreshSceneRef.current = refreshCurrentScene;
                        /*showFullScreenCam({
                            cameraStream: enableCanvasCamera
                                ? canvasElemRef.current
                                : videoStream,
                            cameraId: videoDeviceId,
                            cameraIsCanvas: enableCanvasCamera,
                            micStream: audioStream,
                            micId: audioDeviceId,
                            showMuteIcon: false,
                        });*/
                    });
                }
            }
        );
        return () => {
            if (broadcastClientRef.current)
                destroyBroadcastClient(broadcastClientRef.current);
            cleanUpDevices();
        };
        // run once on mount
    }, []);

    return (
        <div
            ref={videoStreamsContainerRef}
            style={{
                width: "100%",
                // width: "1200px",
                height: "100%",
                display: "block",
            }}
        ></div>
    );
};

export default VideoBroadcast;
