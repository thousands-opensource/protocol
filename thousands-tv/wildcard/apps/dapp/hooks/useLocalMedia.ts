import { Dispatch, SetStateAction, useContext, useRef, useState } from "react";
import { UserSettingsContext } from "@/contexts/userSettingsContext";
import useLocalStorage from "@/hooks/useLocalStorage";
import {
    getAvailableDevices,
    getCameraStream,
    getConnectedDevices,
    getDisconnectedDevices,
    getIdealDevice,
    getMicrophoneStream,
    getScreenshareStream,
} from "@/utils/localMediaUtil";
import toast from "react-hot-toast";
import {
    LocalStageStream,
    StageParticipantInfo,
    StageStrategy,
    SubscribeType,
} from "amazon-ivs-web-broadcast";
import { CustomMediaDeviceInfo, CustomStageStrategy } from "@/types";
import { ORIENTATION } from "@/utils/userSettings";
import { debounce } from "@/utils/streamUtils";

export type LocalMediaContextType = {
    permissions: boolean;
    localVideoMounted: boolean;
    localAudioMounted: boolean;
    audioDevices: any[];
    videoDevices: any[];
    localAudioStreamRef: any;
    localVideoStreamRef: any;
    localAudioDeviceId: string;
    localVideoDeviceId: string;
    videoElemRef: any;
    canvasElemRef: any;
    refreshSceneRef: any;
    localScreenShareStreamRef: any;
    enableCanvasCamera: any;
    setEnableCanvasCamera: any;
    updateLocalAudio: (
        deviceId: string,
        _audioDevices?: CustomMediaDeviceInfo[]
    ) => Promise<MediaStream | undefined>;
    updateLocalVideo: (
        deviceId: string,
        _videoDevices?: CustomMediaDeviceInfo[]
    ) => Promise<MediaStream | undefined>;
    setInitialDevices: () => Promise<{
        audioDeviceId: string;
        audioStream: MediaStream;
        videoDeviceId: string;
        videoStream: MediaStream;
    }>;
    cleanUpDevices: () => void;
    refreshDevices: (e?: any) => Promise<{
        audioDevices: {
            label: any;
            value: any;
        }[];
        videoDevices: {
            label: any;
            value: any;
        }[];
        permissions: boolean;
    }>;
    setAudioDevices: Dispatch<SetStateAction<any[]>>;
    setVideoDevices: Dispatch<SetStateAction<any[]>>;
    startScreenShare: () => Promise<MediaStream | undefined>;
    stopScreenShare: () => Promise<void>;
    strategy: CustomStageStrategy;
    setStrategy: Dispatch<SetStateAction<CustomStageStrategy>>;
};

function useLocalMedia() {
    const { configRef, orientation } = useContext(UserSettingsContext);

    const videoElemRef = useRef();
    const canvasElemRef = useRef();
    const localAudioStreamRef = useRef<MediaStream>();
    const localVideoStreamRef = useRef<MediaStream>();
    const localVideoDeviceIdRef = useRef<string>();
    const localAudioDeviceIdRef = useRef<string>();
    const localScreenShareRef = useRef<MediaStream>();
    // const refreshSceneRef = useRef<{
    //     micContent: MediaStream;
    //     micId: string;
    //     cameraContent: MediaStream;
    //     cameraId: string;
    // }>();
    const refreshSceneRef = useRef();

    const [permissions, setPermissions] = useState<boolean>(false);
    const [audioDevices, setAudioDevices] = useState<CustomMediaDeviceInfo[]>(
        []
    );
    const [videoDevices, setVideoDevices] = useState<CustomMediaDeviceInfo[]>(
        []
    );
    const [localVideoMounted, setLocalVideoMounted] = useState<boolean>(false);
    const [localAudioMounted, setLocalAudioMounted] = useState<boolean>(false);
    const [enableCanvasCamera, setEnableCanvasCamera] =
        useState<boolean>(false);

    const [savedAudioDeviceId, setSavedAudioDeviceId] = useLocalStorage(
        "savedAudioDeviceId",
        undefined,
        true
    );
    const [savedVideoDeviceId, setSavedVideoDeviceId] = useLocalStorage(
        "savedVideoDeviceId",
        undefined,
        true
    );

    const [strategy, setStrategy] = useState<CustomStageStrategy>(() => {
        const strategy: CustomStageStrategy = {
            audioTrack: null,
            videoTrack: null,

            updateTracks(
                newAudioTrack: LocalStageStream | null,
                newVideoTrack: LocalStageStream | null
            ) {
                this.audioTrack = newAudioTrack;
                this.videoTrack = newVideoTrack;
            },

            stageStreamsToPublish() {
                return [this.audioTrack, this.videoTrack] as LocalStageStream[];
            },

            shouldPublishParticipant(participant: StageParticipantInfo) {
                return true;
            },

            shouldSubscribeToParticipant(participant: StageParticipantInfo) {
                return "audio_video" as SubscribeType;
            },
        };

        return strategy;
    });

    const setInitialDevices = async () => {
        const {
            videoDevices: _videoDevices,
            audioDevices: _audioDevices,
            permissions: _permissions,
        } = await refreshDevices();

        let audioDeviceId = getIdealDevice(savedAudioDeviceId, _audioDevices);
        let videoDeviceId = getIdealDevice(savedVideoDeviceId, _videoDevices);

        const audioStream = await updateLocalAudio(audioDeviceId);
        const videoStream = await updateLocalVideo(videoDeviceId);

        navigator.mediaDevices.addEventListener(
            "devicechange",
            handleDeviceChange
        );

        return {
            audioDeviceId,
            audioStream,
            videoDeviceId,
            videoStream,
        };
    };

    const cleanUpDevices = () => {
        navigator.mediaDevices.removeEventListener(
            "devicechange",
            handleDeviceChange
        );
    };

    const refreshDevices = async (e?: any) => {
        const isDeviceChange = e?.type === "devicechange";

        const {
            videoDevices: _videoDevices,
            audioDevices: _audioDevices,
            permissions,
        } = await getAvailableDevices({
            savedAudioDeviceId,
            savedVideoDeviceId,
        });

        const formattedAudioDevices = _audioDevices.map((device: any) => {
            return { label: device.label, value: device.deviceId };
        });
        const formattedVideoDevices = _videoDevices.map((device: any) => {
            return { label: device.label, value: device.deviceId };
        });

        let newAudioDevice: CustomMediaDeviceInfo | undefined;
        let newVideoDevice: CustomMediaDeviceInfo | undefined;

        setAudioDevices((prevState: CustomMediaDeviceInfo[]) => {
            if (!isDeviceChange) return formattedAudioDevices;
            if (prevState.length > formattedAudioDevices.length) {
                // Device disconnected
                const [disconnectedDevice] = getDisconnectedDevices(
                    prevState,
                    formattedAudioDevices
                );
                if (
                    disconnectedDevice.value === localAudioDeviceIdRef.current
                ) {
                    // Currently active device was disconnected
                    newAudioDevice =
                        formattedAudioDevices.find(
                            ({ value }: any) => value === "default"
                        ) || formattedAudioDevices[0];
                }

                console.log("Audio Device disconnected");
                toast.error(
                    `Device disconnected: ${disconnectedDevice.label}`,
                    {
                        id: "MIC_DEVICE_UPDATE",
                    }
                );
            } else if (prevState.length < formattedAudioDevices.length) {
                // Device connected
                const [connectedDevice] = getConnectedDevices(
                    prevState,
                    formattedAudioDevices
                );
                console.log("Audio Device connected");
                toast.success(`Device connected: ${connectedDevice.label}`, {
                    id: "MIC_DEVICE_UPDATE",
                });
            }
            return formattedAudioDevices;
        });

        setVideoDevices((prevState: CustomMediaDeviceInfo[]) => {
            if (!isDeviceChange) return formattedVideoDevices;
            if (prevState.length > formattedVideoDevices.length) {
                // Device disconnected
                const [disconnectedDevice] = getDisconnectedDevices(
                    prevState,
                    formattedVideoDevices
                );

                if (
                    disconnectedDevice.value === localAudioDeviceIdRef.current
                ) {
                    // Currently active device was disconnected
                    newVideoDevice =
                        formattedVideoDevices.find(
                            ({ value }: any) => value === "default"
                        ) || formattedVideoDevices[0];
                }

                console.log("Video Device disconnected");
                toast.error(
                    `Device disconnected: ${disconnectedDevice.label}`,
                    {
                        id: "CAM_DEVICE_UPDATE",
                    }
                );
            } else if (prevState.length < formattedVideoDevices.length) {
                // Device connected
                const [connectedDevice] = getConnectedDevices(
                    prevState,
                    formattedVideoDevices
                );
                console.log("Video Device connected");
                toast.success(`Device connected: ${connectedDevice.label}`, {
                    id: "CAM_DEVICE_UPDATE",
                });
            }
            return formattedVideoDevices;
        });

        let newAudioStream, newVideoStream;
        if (newAudioDevice) {
            newAudioStream = await updateLocalAudio(
                newAudioDevice.value,
                formattedAudioDevices
            );
        }

        if (newVideoDevice) {
            newVideoStream = await updateLocalVideo(
                newVideoDevice.value,
                formattedVideoDevices
            );
        }

        if (refreshSceneRef.current) {
            let newParams: any = {};
            if (newAudioStream) {
                newParams.micContent = newAudioStream;
            }
            if (newAudioDevice) {
                newParams.micId = newAudioDevice.value;
            }
            if (newVideoStream) {
                newParams.cameraContent = newVideoStream;
            }
            if (newVideoDevice) {
                newParams.cameraId = newVideoDevice.value;
            }
            refreshSceneRef.current = newParams;
        }

        setPermissions(permissions);

        return {
            audioDevices: formattedAudioDevices,
            videoDevices: formattedVideoDevices,
            permissions,
        };
    };

    const updateLocalAudio = async (
        deviceId: string,
        _audioDevices = audioDevices
    ) => {
        try {
            if (localAudioStreamRef && localAudioStreamRef.current) {
                localAudioStreamRef.current &&
                    localAudioStreamRef.current.getTracks()[0].stop();
            }
        } catch (err: any) {
            console.error(err);
        }
        const audioStream = await setLocalAudioFromId(deviceId);
        localAudioDeviceIdRef.current = deviceId;
        setSavedAudioDeviceId(deviceId);

        const device = _audioDevices.find((device) => {
            return device.value === deviceId;
        });
        if (device) {
            console.log("Changed mic");
            toast.success(`Changed mic: ${device.label}`, {
                id: "MIC_DEVICE_UPDATE",
                duration: 5000,
            });
        }

        return audioStream;
    };

    const updateLocalVideo = async (
        deviceId: string,
        _videoDevices = videoDevices
    ) => {
        try {
            if (localVideoStreamRef && localVideoStreamRef.current) {
                localVideoStreamRef.current &&
                    localVideoStreamRef.current.getTracks()[0].stop();
            }
        } catch (err: any) {
            console.error(err);
        }

        const videoStream = await setLocalVideoFromId(deviceId);
        localVideoDeviceIdRef.current = deviceId;
        setSavedVideoDeviceId(deviceId);

        const device = _videoDevices.find(
            (device) => device.value === deviceId
        );
        if (device) {
            console.log("Changed camera");
            toast.success(`Changed camera: ${device.label}`, {
                id: "CAM_DEVICE_UPDATE",
                duration: 5000,
            });
        }

        return videoStream;
    };

    const startScreenShare = async () => {
        let screenShareStream = undefined;
        try {
            screenShareStream = await getScreenshareStream();
            localScreenShareRef.current = screenShareStream;
        } catch (err) {
            console.error(err);
        }
        return screenShareStream;
    };

    const stopScreenShare = async () => {
        if (localScreenShareRef && localScreenShareRef.current) {
            for (const track of localScreenShareRef.current?.getTracks()) {
                track.stop();
            }
        }
    };

    const setLocalVideoFromId = async (deviceId: string) => {
        const _config = configRef.current
            ? configRef.current
            : { maxResolution: { width: 1280, height: 720 } };
        const {
            maxResolution: { width = 1280, height = 720 },
        } = _config;
        const videoStream = await getCameraStream({
            deviceId,
            width,
            height,
            facingMode: "environment",
            frameRate: 30,
            aspectRatio:
                orientation === ORIENTATION.LANDSCAPE ? 16 / 9 : 9 / 16,
        });
        localVideoStreamRef.current = videoStream;
        if (!localVideoMounted) setLocalVideoMounted(true);
        return videoStream;
    };

    const setLocalAudioFromId = async (deviceId: string) => {
        const audioStream = await getMicrophoneStream(deviceId);
        localAudioStreamRef.current = audioStream;
        if (!localAudioMounted) setLocalAudioMounted(true);
        return audioStream;
    };

    const handleDeviceChange = debounce(refreshDevices, 1000);

    return {
        permissions,
        localVideoMounted,
        localAudioMounted,
        audioDevices,
        videoDevices,
        localAudioStreamRef,
        localVideoStreamRef,
        localAudioDeviceId: savedAudioDeviceId,
        localVideoDeviceId: savedVideoDeviceId,
        videoElemRef,
        canvasElemRef,
        refreshSceneRef,
        localScreenShareStreamRef: localScreenShareRef,
        enableCanvasCamera,
        setEnableCanvasCamera,
        updateLocalAudio,
        updateLocalVideo,
        setInitialDevices,
        cleanUpDevices,
        refreshDevices,
        setAudioDevices,
        setVideoDevices,
        startScreenShare,
        stopScreenShare,
        strategy,
        setStrategy,
    } as LocalMediaContextType;
}

export default useLocalMedia;
