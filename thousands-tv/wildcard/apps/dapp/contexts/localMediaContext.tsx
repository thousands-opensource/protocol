import { createContext, useMemo, ReactNode } from "react";
import useLocalMedia, { LocalMediaContextType } from "@/hooks/useLocalMedia";

const LocalMediaContext = createContext<LocalMediaContextType>(
    {} as LocalMediaContextType
);

type ContextProviderProps = {
    children?: ReactNode;
};

function LocalMediaProvider({ children }: ContextProviderProps) {
    const {
        permissions,
        localVideoMounted,
        localAudioMounted,
        audioDevices,
        videoDevices,
        localAudioStreamRef,
        localVideoStreamRef,
        localAudioDeviceId,
        localVideoDeviceId,
        videoElemRef,
        canvasElemRef,
        refreshSceneRef,
        localScreenShareStreamRef,
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
    } = useLocalMedia();

    const state = useMemo(() => {
        return {
            permissions,
            localVideoMounted,
            localAudioMounted,
            audioDevices,
            videoDevices,
            localAudioStreamRef,
            localVideoStreamRef,
            localAudioDeviceId,
            localVideoDeviceId,
            videoElemRef,
            canvasElemRef,
            refreshSceneRef,
            localScreenShareStreamRef,
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
        };
    }, [
        permissions,
        localVideoMounted,
        localAudioMounted,
        audioDevices,
        videoDevices,
        localAudioStreamRef,
        localVideoStreamRef,
        localAudioDeviceId,
        localVideoDeviceId,
        videoElemRef,
        canvasElemRef,
        refreshSceneRef,
        localScreenShareStreamRef,
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
    ]);

    return (
        <LocalMediaContext.Provider value={state}>
            {children}
        </LocalMediaContext.Provider>
    );
}

export default LocalMediaProvider;
export { LocalMediaContext };
