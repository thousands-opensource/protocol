import { useContext } from "react";
import {
    Flex,
    IconButton,
    SimpleGrid,
    GridItem,
    ButtonGroup,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
} from "@chakra-ui/react";
import { FaMicrophone } from "react-icons/fa";
import { FaMicrophoneSlash } from "react-icons/fa";
import { FaVideo } from "react-icons/fa";
import { FaVideoSlash } from "react-icons/fa";
import { MdScreenShare } from "react-icons/md";
import { MdStopScreenShare } from "react-icons/md";
import { FaEllipsisVertical } from "react-icons/fa6";
import { MdCallEnd } from "react-icons/md";
import { useStreamControlContext } from "@/contexts/streamControlsContext";
import { getUserDisplayName } from "@/utils/streamUtils";
import { CheckCircleIcon } from "@chakra-ui/icons";
import { usePathname } from "next/navigation";
import { REAL_TIME_STREAM_ROUTE } from "@/constants/stream";
import { BroadcastContext } from "@/contexts/broadcastContext";
import { LocalMediaContext } from "@/contexts/localMediaContext";
import { LocalStageStream } from "amazon-ivs-web-broadcast";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { useStreamContext } from "@/contexts/streamContext";

interface RealTimeStreamControlsProps {}

const RealTimeStreamControls = ({}: RealTimeStreamControlsProps) => {
    const {
        isCallEnded,
        setIsCallEnded,
        isMicrophoneOn,
        setIsMicrophoneOn,
        isVideoOn,
        setIsVideoOn,
        isShareScreenOn,
        setIsShareScreenOn,
        isOpenMoreOptions,
        setIsOpenMoreOptions,
        isMoreCallEndedOptions,
        setIsMoreCallEndedOptions,
    } = useStreamControlContext();

    const { stage } = useStreamContext();

    const {
        audioDevices,
        videoDevices,
        strategy,
        updateLocalVideo,
        updateLocalAudio,
        localAudioDeviceId,
        localAudioStreamRef,
        localVideoDeviceId,
        localVideoStreamRef,
        refreshDevices,
    } = useContext(LocalMediaContext);

    const { createLocalStageStream } = useContext(BroadcastContext);

    const pathname = usePathname();
    const isRealTimeStreamRoute = pathname.includes(REAL_TIME_STREAM_ROUTE);
    const hideControls = isRealTimeStreamRoute ? "grid" : "none";
    const { userDB } = useWildfileUserContext();

    // const [savedAudioDeviceId, setSavedAudioDeviceId] = useLocalStorage(
    //     "savedAudioDeviceId",
    //     localAudioDeviceId,
    //     true
    // );
    // const [savedVideoDeviceId, setSavedVideoDeviceId] = useLocalStorage(
    //     "savedVideoDeviceId",
    //     localVideoDeviceId,
    //     true
    // );

    /**
     * Turn on/off microphone
     */
    const handleToggleMicrophone = () => {
        setIsMicrophoneOn(!isMicrophoneOn);
    };

    /**
     * Turn on/off video
     */
    const handleToggleVideo = () => {
        setIsVideoOn(!isVideoOn);
    };

    /**
     * Turn on/off screenshare
     */
    const handleToggleShareScreenOn = () => {
        setIsShareScreenOn(!isShareScreenOn);
    };

    /**
     * Open more available options regarding stream
     */
    const handleOpenMoreOptions = () => {
        setIsOpenMoreOptions(!isOpenMoreOptions);
    };

    /**
     * Turn on/off stream/call
     */
    const handleCallEnded = () => {
        setIsCallEnded(true);
    };

    /**
     * Open more available options to leave stream/call or end the stream/call
     */
    const handleOpenMoreCallEndedOptions = () => {
        setIsMoreCallEndedOptions(!isMoreCallEndedOptions);
    };

    const refreshMediaDevices = async (
        videoDeviceId: string,
        audioDeviceId: string
    ) => {
        if (!stage) {
            console.log("Stage does not exist.");
            return;
        }

        let cameraStageStream: LocalStageStream | null = null;
        let micStageStream: LocalStageStream | null = null;

        const videoStream = await updateLocalVideo(videoDeviceId);
        const audioStream = await updateLocalAudio(audioDeviceId);
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

        strategy.updateTracks(micStageStream, cameraStageStream);
        stage.refreshStrategy();
    };

    const handleSwitchVideoDevice = async (videoDeviceId: string) => {
        refreshMediaDevices(videoDeviceId, localAudioDeviceId);
    };

    const handleSwitchMicrophoneDevice = async (audioDeviceId: string) => {
        refreshMediaDevices(localVideoDeviceId, audioDeviceId);
    };

    const displayName = getUserDisplayName(userDB);

    return (
        <Flex
            sx={{
                justifyContent: "space-between",
                alignItems: "center",
                height: [0, 0, 0, "80px"],
            }}
        >
            <SimpleGrid columns={8} spacing={10} width="100%">
                <GridItem colSpan={2} />

                <GridItem colSpan={4} display={hideControls}>
                    <Flex
                        sx={{
                            gap: 4,
                            justifyContent: "center",
                            alignItems: "center",
                            height: "100%",
                        }}
                    >
                        <ButtonGroup size="lg" isAttached variant="outline">
                            <IconButton
                                variant="outline"
                                size="lg"
                                aria-label="Microphone"
                                icon={
                                    isMicrophoneOn ? (
                                        <FaMicrophoneSlash />
                                    ) : (
                                        <FaMicrophone />
                                    )
                                }
                                onClick={handleToggleMicrophone}
                            />
                            <Menu isLazy>
                                <MenuButton
                                    as={IconButton}
                                    minW={"var(--chakra-sizes-6)"}
                                    aria-label="Microphone Setting"
                                    icon={<FaEllipsisVertical />}
                                    variant="outline"
                                    isDisabled={audioDevices.length === 0}
                                />
                                <MenuList
                                    sx={{
                                        bgColor: "#1e232a",
                                        "& > button": {
                                            bgColor: "#1e232a",
                                            _hover: {
                                                opacity: 0.5,
                                            },
                                        },
                                    }}
                                >
                                    {audioDevices.map((audioDevice, index) => {
                                        const isSameAudioDeviceId =
                                            audioDevice.value ===
                                            localAudioDeviceId;
                                        const icon = isSameAudioDeviceId ? (
                                            <CheckCircleIcon
                                                fontSize={"small"}
                                            />
                                        ) : (
                                            <></>
                                        );
                                        return (
                                            <MenuItem
                                                key={index}
                                                onClick={async () => {
                                                    await handleSwitchMicrophoneDevice(
                                                        audioDevice.value
                                                    );
                                                }}
                                                isDisabled={isSameAudioDeviceId}
                                                icon={icon}
                                            >
                                                {audioDevice.label}
                                            </MenuItem>
                                        );
                                    })}
                                </MenuList>
                            </Menu>
                        </ButtonGroup>
                        <ButtonGroup size="lg" isAttached variant="outline">
                            <IconButton
                                variant="outline"
                                size="lg"
                                aria-label="Video"
                                icon={
                                    isVideoOn ? <FaVideoSlash /> : <FaVideo />
                                }
                                onClick={handleToggleVideo}
                            />
                            <Menu isLazy>
                                <MenuButton
                                    as={IconButton}
                                    minW={"var(--chakra-sizes-6)"}
                                    aria-label="Video Setting"
                                    icon={<FaEllipsisVertical />}
                                    variant="outline"
                                    isDisabled={videoDevices.length === 0}
                                />
                                <MenuList
                                    sx={{
                                        bgColor: "#1e232a",
                                        "& > button": {
                                            bgColor: "#1e232a",
                                            _hover: {
                                                opacity: 0.5,
                                            },
                                        },
                                    }}
                                >
                                    {videoDevices.map((videoDevice, index) => {
                                        const isSameVideoDeviceId =
                                            videoDevice.value ===
                                            localVideoDeviceId;

                                        const icon = isSameVideoDeviceId ? (
                                            <CheckCircleIcon
                                                fontSize={"small"}
                                            />
                                        ) : (
                                            <></>
                                        );
                                        return (
                                            <MenuItem
                                                key={index}
                                                onClick={async () => {
                                                    await handleSwitchVideoDevice(
                                                        videoDevice.value
                                                    );
                                                }}
                                                isDisabled={isSameVideoDeviceId}
                                                icon={icon}
                                            >
                                                {videoDevice.label}
                                            </MenuItem>
                                        );
                                    })}
                                </MenuList>
                            </Menu>
                        </ButtonGroup>
                        <IconButton
                            variant="outline"
                            size="lg"
                            aria-label="Share Screen"
                            icon={
                                isShareScreenOn ? (
                                    <MdStopScreenShare />
                                ) : (
                                    <MdScreenShare />
                                )
                            }
                            onClick={handleToggleShareScreenOn}
                        />
                        <IconButton
                            variant="outline"
                            size="lg"
                            aria-label="More"
                            icon={<FaEllipsisVertical />}
                            onClick={handleOpenMoreOptions}
                        />
                        <ButtonGroup size="lg" isAttached variant="outline">
                            <IconButton
                                aria-label="End Stream/Call"
                                minW={"4rem"}
                                _hover={{
                                    bgColor: "var(--chakra-colors-red-500)",
                                    opacity: 0.5,
                                }}
                                sx={{ bgColor: "var(--chakra-colors-red-500)" }}
                                icon={<MdCallEnd />}
                                onClick={handleCallEnded}
                            />
                            <IconButton
                                aria-label="More"
                                icon={<FaEllipsisVertical />}
                                onClick={handleOpenMoreCallEndedOptions}
                            />
                        </ButtonGroup>
                    </Flex>
                </GridItem>
                <GridItem colSpan={2} />
            </SimpleGrid>
        </Flex>
    );
};
export default RealTimeStreamControls;
