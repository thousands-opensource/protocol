"use client";
import React, { FC } from "react";
import { ChevronDownIcon, CloseIcon } from "@chakra-ui/icons";
import { Link } from "@chakra-ui/next-js";
import {
    Box,
    Flex,
    HStack,
    Icon,
    Stack,
    useDisclosure,
    Link as ChakraLink,
    Popover,
    PopoverTrigger,
    PopoverContent,
    Hide,
    Show,
    Image,
    Text,
} from "@chakra-ui/react";
import { FaBars } from "react-icons/fa";
import AuthButton from "./AuthButton";
import { blurredBackgroundNav } from "@/theme/components/shared";
import { THEME_COLOR_COLOR_PRIMARY } from "@/theme/constants";
import { getWebAppName } from "@/utils/environmentUtilWCA";

const WEB_APP_NAME = getWebAppName();

interface IMainNavigationProps {}

/**
 * React component that displays the main navigation bar.
 */
const MainNavigation: FC<IMainNavigationProps> = () => {
    const mobileNavigation = useDisclosure();

    interface NavLink {
        name: string;
        url: string;
        sub?: NavLink[];
        isExternal?: boolean;
    }

    const links: NavLink[] = [];

    return (
        <Box
            pos="sticky"
            top="0"
            zIndex="sticky"
            borderBottom="0.5px solid"
            borderColor="gray.600"
        >
            <Flex
                justify="space-between"
                h="64px"
                sx={blurredBackgroundNav}
                p="4"
            >
                <HStack color="white" gap="4">
                    <Link href="/">
                        <Flex
                            flexDirection={"row"}
                            justify="center"
                            alignItems={"center"}
                            gap="10px"
                        >
                            <Box>
                                <Image
                                    color={THEME_COLOR_COLOR_PRIMARY}
                                    src={"/images/Thousands/T-512.svg"}
                                    alt="wildcard logo"
                                    w="30px"
                                    h="30px"
                                />
                            </Box>
                            <Text fontSize="xl" textTransform="capitalize">
                                {WEB_APP_NAME}
                            </Text>
                        </Flex>
                    </Link>
                    <HStack spacing={4} display={{ base: "none", md: "flex" }}>
                        {links.map((link) => {
                            if (link?.sub) {
                                return (
                                    <Popover key={link.name}>
                                        <PopoverTrigger>
                                            <Box>
                                                {link.name}
                                                <ChevronDownIcon />
                                            </Box>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            bg="black"
                                            mt="6"
                                            color="white"
                                            p={4}
                                            boxShadow="5px 5px 0 blue"
                                            maxW="197px"
                                            maxH="160px"
                                        >
                                            <Stack>
                                                {link?.sub?.map((sub) => (
                                                    <ChakraLink
                                                        href={sub.url}
                                                        key={sub.name}
                                                    >
                                                        {sub.name}
                                                    </ChakraLink>
                                                ))}
                                            </Stack>
                                        </PopoverContent>
                                    </Popover>
                                );
                            }

                            return (
                                <Link
                                    href={link.url}
                                    key={link.name}
                                    target={
                                        link.isExternal ? "_blank" : undefined
                                    }
                                    rel={
                                        link.isExternal
                                            ? "noopener noreferrer"
                                            : undefined
                                    }
                                >
                                    {link.name}
                                </Link>
                            );
                        })}
                    </HStack>
                </HStack>
                <Hide below="md">
                    <HStack>
                        <AuthButton />
                    </HStack>
                </Hide>
                <HStack
                    display={{
                        base: "flex",
                        md: "none",
                    }}
                    onClick={mobileNavigation.onToggle}
                >
                    <Icon
                        as={mobileNavigation.isOpen ? CloseIcon : FaBars}
                        color="white"
                        boxSize="6"
                    />
                </HStack>
            </Flex>

            {mobileNavigation.isOpen && (
                <Stack
                    p="4"
                    pos="absolute"
                    bg="brand.500"
                    w="full"
                    zIndex="500"
                >
                    <Stack
                        color="white"
                        spacing={4}
                        display={{ base: "flex", md: "none" }}
                    >
                        {links.map((link) => (
                            <Link
                                href={link.url}
                                fontSize="lg"
                                color="white"
                                key={link.name}
                                target={link.isExternal ? "_blank" : undefined}
                                rel={
                                    link.isExternal
                                        ? "noopener noreferrer"
                                        : undefined
                                }
                            >
                                {link.name}
                            </Link>
                        ))}
                    </Stack>
                    <Flex as={Show} below="md" justify="end">
                        <AuthButton />
                    </Flex>
                </Stack>
            )}
        </Box>
    );
};
export default MainNavigation;
