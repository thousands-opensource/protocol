import {
    Dispatch,
    ReactNode,
    RefObject,
    SetStateAction,
    createContext,
} from "react";
import {
    useSavedValuesFromLocalStorage,
    CHANNEL_TYPES,
    ORIENTATION,
    VideoResolutionConfig,
} from "@/utils/userSettings";

interface UserSettingsProviderProps {
    children: ReactNode;
}

export interface UserSettingsContextInterface {
    channelType: CHANNEL_TYPES;
    setChannelType: Dispatch<SetStateAction<CHANNEL_TYPES>>;
    selectedVideoDeviceId: string;
    setSelectedVideoDeviceId: Dispatch<SetStateAction<string>>;
    selectedAudioDeviceId: string;
    setSelectedAudioDeviceId: Dispatch<SetStateAction<string>>;
    orientation: ORIENTATION;
    setOrientation: Dispatch<SetStateAction<ORIENTATION>>;
    resolution: number;
    setResolution: Dispatch<SetStateAction<number>>;
    configRef: RefObject<VideoResolutionConfig>;
    streamKey: string | undefined;
    setStreamKey: Dispatch<SetStateAction<string | undefined>>;
    ingestEndpoint: string;
    setIngestEndpoint: Dispatch<SetStateAction<string>>;
    localVideoMirror: boolean;
    setLocalVideoMirror: Dispatch<SetStateAction<boolean>>;
    audioNoiseSuppression: boolean;
    setAudioNoiseSuppression: Dispatch<SetStateAction<boolean>>;
    autoGainControl: boolean;
    setAutoGainControl: Dispatch<SetStateAction<boolean>>;
    saveSettings: boolean;
    setSaveSettings: Dispatch<SetStateAction<boolean>>;
    clearSavedSettings: () => void;
}

const UserSettingsContext = createContext<UserSettingsContextInterface>(
    {} as UserSettingsContextInterface
);

function UserSettingsProvider({ children }: UserSettingsProviderProps) {
    const savedValues = useSavedValuesFromLocalStorage();

    return (
        <UserSettingsContext.Provider value={savedValues}>
            {children}
        </UserSettingsContext.Provider>
    );
}

export default UserSettingsProvider;
export { UserSettingsContext };
