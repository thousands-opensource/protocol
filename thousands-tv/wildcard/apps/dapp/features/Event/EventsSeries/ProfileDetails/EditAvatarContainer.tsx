import { Box, Flex, Avatar, Icon } from "@chakra-ui/react";
import { FiEdit } from "react-icons/fi";

interface StyledAvatarContainerProps {
    profPictureSrc: string;
    avatarThemeColor: any;
    connectedUserDBEmail: string;
}

/**
 * Styled Avatar Container with edit icon
 */
const StyledAvatarContainer = ({
    profPictureSrc,
    avatarThemeColor,
    connectedUserDBEmail,
}: StyledAvatarContainerProps) => {
    return (
        <Flex
            position="relative"
            justifyContent="center"
            alignSelf="center"
            w="100%"
        >
            {/* Gradient Background Rectangle */}
            <Box
                position="absolute"
                top="10%"
                width={["100%", "280px", "280px", "320px"]}
                height="200px"
                borderRadius="xl"
                background="linear-gradient(120deg, #9333EA 0%, #4F46E5 100%)"
                zIndex={0}
                mt="-100px"
            >
                {/* Edit Icon Container */}
                {/* <Box
                    position="absolute"
                    bottom={0}
                    left={4}
                    p={2}
                    display={["none", "none", "none", "block"]}
                    borderRadius="md"
                    bg="rgba(255, 255, 255, 0.1)"
                    cursor="pointer"
                    _hover={{ bg: "rgba(255, 255, 255, 0.2)" }}
                >
                    <FiEdit color="white" size={20} />
                </Box> */}
            </Box>

            {/* Avatar */}
            <Avatar
                src={profPictureSrc}
                w="200px"
                h="200px"
                borderWidth="8px"
                borderStyle="solid"
                borderColor={avatarThemeColor.hexValue}
                name={connectedUserDBEmail ?? ""}
                zIndex={1}
            />
        </Flex>
    );
};

export default StyledAvatarContainer;
