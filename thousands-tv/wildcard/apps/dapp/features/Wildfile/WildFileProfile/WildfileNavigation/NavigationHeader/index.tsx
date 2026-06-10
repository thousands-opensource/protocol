import { ROOT_WILDFILE_URL } from "@/constants/constants";
import {
    ServerName,
    SERVER_CONFIGS,
    DEFAULT_SERVER_PLACEHOLDER,
    ServerConfig,
} from "@/utils/serverUtil";
import { Box, Flex, Hide, Text, Image, HStack } from "@chakra-ui/react";
import { motion } from "framer-motion";

// Utility function using enum
export const getServerConfig = (serverCode: ServerName): ServerConfig => {
    const config = SERVER_CONFIGS[serverCode];

    if (!config) {
        console.warn(`No configuration found for server code: ${serverCode}`);
        return DEFAULT_SERVER_PLACEHOLDER;
    }

    return config;
};

//motion causes needless rerenders if inside a component
const MotionBox = motion(Box);

interface NavigationHeaderProps {
    serverCode: string;
    serverPrimaryLogoUrl: string;
}

/**
 * Navigation header component for the top navigation bar. (shown on desktop)
 * displays the server name
 */
const NavigationHeader = ({
    serverCode,
    serverPrimaryLogoUrl,
}: NavigationHeaderProps) => {
    const serverConfig = getServerConfig(serverCode as ServerName);

    const renderServerLogoAsset = () => {
        if (!serverPrimaryLogoUrl || serverPrimaryLogoUrl === "") {
            return (
                <Text
                    fontSize="xl"
                    fontWeight="bold"
                    color="white"
                    letterSpacing="wide"
                    sx={{
                        textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                >
                    {serverConfig.serverName}
                </Text>
            );
        }

        return (
            <Image
                src={`/images/${mobileVersionOfPrimaryLogoUrl}`}
                h={serverConfig.serverLogoHeight}
                alt="logo"
                loading="lazy"
            />
        );
    };

    const mobileVersionOfPrimaryLogoUrl = serverPrimaryLogoUrl.replace(
        ".svg",
        "M.svg"
    );

    //

    return (        
        <Flex
            h="50px"
            w="full"
            alignItems="center"
            position="relative"
            overflow="hidden"
        >
            <Box />
            <MotionBox
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                zIndex={2}
                px={6}
            >
                <HStack>
                    <Box
                        as="a"
                        href={ROOT_WILDFILE_URL}
                        display="inline-flex"
                        alignItems="center"
                    >
                        <HStack>
                            <Image
                                src={serverConfig.primaryLogoUrl}
                                h="45px"
                                w="45px"
                                alt="logo"
                                loading="lazy"
                            />
                        </HStack>
                    </Box>
                    <Hide below="md">
                        {renderServerLogoAsset()}
                    </Hide>
                </HStack>
            </MotionBox>
        </Flex>        
    );
};

export default NavigationHeader;
