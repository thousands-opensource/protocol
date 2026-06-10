import React from "react";
import { Flex, Text, Icon, HStack, VStack, Box } from "@chakra-ui/react";
import {
    FaDiscord,
    FaTwitter,
    FaInstagram,
    FaGithub,
    FaMedium,
    FaBookmark,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

interface SocialLinkProps {
    icon: any;
    href: string;
}

/**
 * SocialLink component - renders a social media link
 */
const SocialLink = ({ icon: IconComponent, href }: SocialLinkProps) => (
    <Box
        as="a"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        transition="all 0.2s ease-in-out"
        _hover={{
            transform: "scale(1.15) translateY(-2px)",
            filter: "brightness(1.2)",
        }}
    >
        <IconComponent
            size={24}
            className="text-gray-400 transition-colors cursor-pointer"
        />
    </Box>
);

const Connections = () => {
    return (
        <VStack align="stretch" spacing={2} w="100%">
            <Text color="gray.400" fontSize="sm" mb={2}>
                Connections
            </Text>
            <HStack spacing={4}>
                <SocialLink icon={FaDiscord} href="#" />
                <SocialLink icon={FaXTwitter} href="#" />
            </HStack>
        </VStack>
    );
};

const UserDescription = () => {
    return (
        <Flex direction="column" gap={1}>
            <Text
                color="gray.400"
                lineHeight="1.6"
                maxW="600px"
                sx={{
                    opacity: 0.7,
                    textTransform: "capitalize",
                }}
                fontSize="xs"
            >
                <Text as="span" color="white" fontWeight="semibold">
                    Sampson
                </Text>{" "}
                Orem Ipsum Dolor Sit Amet, Consec-Tetuer Adipiscing Elit, Sed
                Diam Nonummy Nibh Euismod Tincidunt Ut Laoreet Dolore Magna
            </Text>
        </Flex>
    );
};

const UserSocialInfo = () => {
    return (
        <VStack align="stretch" spacing={6} w="100%">
            <Connections />
            {/*<UserDescription />*/}
        </VStack>
    );
};

export default UserSocialInfo;
