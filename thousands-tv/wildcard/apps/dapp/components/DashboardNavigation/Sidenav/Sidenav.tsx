"use client";
import { WILDFILE_ROUTES } from "@/constants/routes";
import { blurredBackground } from "@/theme/components/shared";
import { THEME_COLOR_COLOR_PRIMARY } from "@/theme/constants";
import { getDiscordInviteLink } from "@/utils/environmentUtil";
import { getWebAppName } from "@/utils/environmentUtilWCA";
import {
    Box,
    Divider,
    HStack,
    Heading,
    Icon,
    Image,
    Stack,
    Text,
    VStack,
} from "@chakra-ui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FC } from "react";
import { FaDiscord } from "react-icons/fa";
import { RiDashboardFill } from "react-icons/ri";

interface ISidenavProps {
    isOpen?: boolean;
}

/**
 * React component that displays a side navigation.
 */
const Sidenav: FC<ISidenavProps> = ({ isOpen = true }) => {
    const pathname = usePathname();

    const isActiveLink = (link: string) => {
        return pathname === link;
    };

    const navLinks = [
        {
            icon: RiDashboardFill,
            text: "Dashboard",
            link: WILDFILE_ROUTES.SERVER.WILDFILE.BASE.url,
        },
    ];

    const bottomnavLinks = [
        {
            icon: FaDiscord,
            text: "Community",
            link: getDiscordInviteLink(),
        },
    ];

    return (
        <Stack
            boxShadow={{
                base: "none",
                lg: "lg",
            }}
            w={{
                base: "full",
                lg: isOpen ? "160px" : "70px",
            }}
            transition="width 0.1s ease-in-out"
            minH={{ base: "calc(100dvh - 38px)", lg: "calc(100dvh - 0px)" }}
            sx={blurredBackground}
            color="whiteAlpha.100"
            zIndex="10"
        >
            <Heading
                textTransform="uppercase"
                fontSize="14px"
                as="h1"
                my="5"
                mx="6"
                color="foreground"
            >
                <Link href={"/"}>
                    <VStack>
                        <Box>
                            <Image
                                color={THEME_COLOR_COLOR_PRIMARY}
                                src={"/images/Thousands/T-512.svg"}
                                alt="wildcard logo"
                                w="30px"
                                h="30px"
                            />
                        </Box>
                        <Box>
                            <Text
                                color="white"
                                fontSize={"sm"}
                                _hover={{ color: "whiteAlpha.600" }}
                                display={isOpen ? "block" : "none"}
                            >
                                {getWebAppName()}
                            </Text>
                        </Box>
                    </VStack>
                </Link>
            </Heading>

            <Divider bg="whiteAlpha.700" />
            <Box>
                <Heading
                    textTransform="uppercase"
                    fontSize="14px"
                    as="h1"
                    my="5"
                    mx="6"
                    color="white"
                >
                    <Link href={"/"}>
                        <Text
                            _hover={{ color: "whiteAlpha.600" }}
                            display={isOpen ? "none" : "block"}
                        >
                            <Icon fontSize="2xl" as={RiDashboardFill} />
                        </Text>
                    </Link>
                </Heading>
                <Box pt="2" mx="3">
                    {navLinks.map((nav) => (
                        <Link href={nav.link} key={nav.text}>
                            <HStack
                                bg={
                                    isActiveLink(nav.link)
                                        ? "brand.500"
                                        : "transparent"
                                }
                                color={
                                    isActiveLink(nav.link) ? "white" : "white"
                                }
                                borderRadius="8px"
                                py="2"
                                px="3"
                                mb="1"
                                _hover={{
                                    bg: "glassDark.bg",
                                }}
                            >
                                <Icon as={nav.icon} />
                                <Text
                                    fontSize="14px"
                                    fontWeight="medium"
                                    display={isOpen ? "block" : "none"}
                                >
                                    {nav.text}
                                </Text>
                            </HStack>
                        </Link>
                    ))}
                </Box>
            </Box>

            <Stack>
                <Box pt="2" mx="3">
                    {bottomnavLinks.map((nav) => (
                        <Link href={nav.link} key={nav.text}>
                            <HStack
                                bg={
                                    isActiveLink(nav.link)
                                        ? "brand.500"
                                        : "transparent"
                                }
                                color={
                                    isActiveLink(nav.link) ? "white" : "white"
                                }
                                borderRadius="8px"
                                py="2"
                                px="3"
                                mb="1"
                                _hover={{
                                    bg: "brand.600",
                                    color: "white",
                                }}
                            >
                                <Icon as={nav.icon} fontSize={"20px"} />
                                <Text
                                    fontSize="md"
                                    fontWeight="medium"
                                    display={isOpen ? "block" : "none"}
                                >
                                    {nav.text}
                                </Text>
                            </HStack>
                        </Link>
                    ))}
                </Box>
            </Stack>
        </Stack>
    );
};

export default Sidenav;
