import { FC, ReactNode, useEffect, useState, useRef } from "react";
import { Box, Flex, useBreakpointValue } from "@chakra-ui/react";
import { useCursorEffect } from "@/contexts/cursorEffectContext";

interface IMainLayoutProps {
    children: ReactNode;
}

/**
 * Thousands Main Layout
 */
const MainLayout: FC<IMainLayoutProps> = ({ children }) => {
    const { isBgChanged } = useCursorEffect();
    const isMobileView = useBreakpointValue(
        {
            base: true,
            sm: true,
            md: true,
            lg: false,
            xl: false,
        },
        { ssr: false }
    );
    const [isMobile, setIsMobile] = useState(isMobileView);
    const [videoSrc, setVideoSrc] = useState("");
    const [isLoaded, setIsLoaded] = useState(true); // @dev - Default to true to prevent flash on first load
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(isMobileView);
        };
        checkIsMobile();
        window.addEventListener("resize", checkIsMobile);

        // Clean up event listener on component unmount
        return () => window.removeEventListener("resize", checkIsMobile);
    }, []);

    /**
     * Update the thousands video asset based on the background change and device type
     */
    useEffect(() => {
        setVideoSrc("/assets/thousands-logged-in-bg.mp4");
    }, [isBgChanged, isMobile]);

    /**
     * Implements a smooth transition when the video is loaded
     */
    useEffect(() => {
        const videoElement = videoRef.current;

        if (videoElement) {
            const handleLoadedData = () => {
                setIsLoaded(true); // Set to true once the video is loaded
            };

            const handleLoadStart = () => {
                setIsLoaded(false); // Set to false when the video starts loading
            };

            videoElement.addEventListener("loadeddata", handleLoadedData);
            videoElement.addEventListener("loadstart", handleLoadStart);

            return () => {
                videoElement.removeEventListener(
                    "loadeddata",
                    handleLoadedData
                );
                videoElement.removeEventListener("loadstart", handleLoadStart);
            };
        }
    }, [videoSrc]);

    return (
        <Flex
            flexDirection="column"
            justifyContent="space-between"
            minH="100vh"
            position="relative"
            overflow="hidden"
            bgPosition="center"
            bgRepeat="no-repeat"
            bgSize="cover"
            backgroundColor={!isLoaded ? "#000000" : "unset"}
            h="100%"
        >
            {videoSrc && (
                <video
                    ref={videoRef}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        zIndex: 1,
                        opacity: isLoaded ? 1 : 0,
                        transition: "opacity 0.5s ease-in-out",
                    }}
                    src={videoSrc}
                />
            )}

            {/* Content */}
            <Box minH="100vh" zIndex={2}>
                {children}
            </Box>
        </Flex>
    );
};

export default MainLayout;
