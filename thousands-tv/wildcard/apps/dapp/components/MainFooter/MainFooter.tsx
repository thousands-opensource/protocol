import {
    LINK_TWITTER,
    LINK_GITHUB,
    LINK_YOUTUBE,
    LINK_INSTAGRAM,
    BLOG,
    HELP_CENTER_URL,
} from "@/constants";
import { getWebAppName } from "@/utils/environmentUtilWCA";
import {
    Box,
    Container,
    Heading,
    SimpleGrid,
    Stack,
    Text,
    VisuallyHidden,
    chakra,
    useColorModeValue,
} from "@chakra-ui/react";
import { ReactNode } from "react";
import { FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";
import { FaGithub } from "react-icons/fa6";

const WEB_APP_NAME = getWebAppName();

/**
 * React component that displays a social button.
 */
const SocialButton = ({
    children,
    label,
    href,
}: {
    children: ReactNode;
    label: string;
    href: string;
}) => {
    return (
        <chakra.button
            bg={useColorModeValue("blackAlpha.100", "whiteAlpha.100")}
            rounded={"full"}
            w={8}
            h={8}
            cursor={"pointer"}
            as={"a"}
            href={href}
            display={"inline-flex"}
            alignItems={"center"}
            justifyContent={"center"}
            transition={"background 0.3s ease"}
            _hover={{
                bg: useColorModeValue("blackAlpha.200", "whiteAlpha.200"),
            }}
        >
            <VisuallyHidden>{label}</VisuallyHidden>
            {children}
        </chakra.button>
    );
};

const ListHeader = ({ children }: { children: ReactNode }) => {
    return (
        <Text fontWeight={"500"} fontSize={"lg"} mb={2} color="white">
            {children}
        </Text>
    );
};

export default function MainFooter() {
    const sxLink = { color: "white", _hover: { color: "primary.500" } };

    return (
        <Box
            bg={useColorModeValue("black", "black")}
            color={useColorModeValue("gray", "gray.200")}
        >
            <Container as={Stack} maxW={"6xl"} py={"10px"}>
                <SimpleGrid
                    templateColumns={{ sm: "1fr 1fr", md: "2fr 1fr 1fr 2fr" }}
                    spacing={8}
                >
                    <Stack spacing={1}>
                        <Box>
                            <Heading textTransform="capitalize">
                                {WEB_APP_NAME}
                            </Heading>
                        </Box>

                        <Text fontSize={"sm"}>
                            © 2024{" "}
                            <Box as="span" px="1" textTransform="capitalize">
                                {WEB_APP_NAME}
                            </Box>
                            . All Rights Reserved.
                        </Text>
                    </Stack>

                    <Stack align={"flex-start"}>
                        <Stack direction={"row"} spacing={6}>
                            <SocialButton label="GitHub" href={LINK_GITHUB}>
                                <FaGithub />
                            </SocialButton>
                            <SocialButton label={"Twitter"} href={LINK_TWITTER}>
                                <FaTwitter />
                            </SocialButton>
                            <SocialButton label={"YouTube"} href={LINK_YOUTUBE}>
                                <FaYoutube />
                            </SocialButton>
                            <SocialButton
                                label={"Instagram"}
                                href={LINK_INSTAGRAM}
                            >
                                <FaInstagram />
                            </SocialButton>
                        </Stack>
                        {/* <ListHeader>Company</ListHeader> */}

                        {/* <Box as="a" href={BLOG} sx={sxLink}>
                            Blog
                        </Box> */}
                    </Stack>
                    {/* <Stack align={"flex-start"}>
                        <ListHeader>Support</ListHeader>
                        <Box as="a" href={HELP_CENTER_URL} sx={sxLink}>
                            Help Center
                        </Box>
                    </Stack> */}
                </SimpleGrid>
            </Container>
        </Box>
    );
}
