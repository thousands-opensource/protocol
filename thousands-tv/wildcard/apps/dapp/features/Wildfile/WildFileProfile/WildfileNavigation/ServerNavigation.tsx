import React, { useEffect, useState } from "react";
import {
    Text,
    Flex,
    Box,
    VStack,
    Circle,
    Icon,
    Image,
    Tooltip,
    Center,
} from "@chakra-ui/react";
import { FaPlus } from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion"; // Make sure to install framer-motion
import { getServerCodeFromPath } from "@/utils/serverUtil";

interface ServerNavigationProps {
    serverCode: string | null;
}

//motion causes needless rerenders if inside a component
const MotionVStack = motion(VStack);
const MotionBox = motion(Box);

/**
 * Server navigation component for the left navigation bar.
 */
const ServerNavigation = ({ serverCode }: ServerNavigationProps) => {
    const router = useRouter();

    const [selectedServerListing, setSelectedAsset] = useState<string | null>(
        serverCode
    );

    interface ServerRoute {
        path: string;
        name: string;
        icon: string;
    }

    interface ServerListings {
        id: string;
        image: string;
        alt: string;
        notificationCount?: number;
        tooltipLabel: string;
    }

    const getNavigationRoutes = (name: string): ServerRoute[] => [
        {
            path: `/${name.toLowerCase()}/events?tab=home`,
            name: "Home",
            icon: "/images/ServerNavigation/home.svg",
        },
        {
            path: `/${name.toLowerCase()}/events?tab=events`,
            name: "Events",
            icon: "/images/ServerNavigation/eventsselected.svg",
        },
        // {
        //     path: `/${name.toLowerCase()}/events?tab=collections`,
        //     name: "Collections",
        //     icon: "/images/ServerNavigation/collections.svg",
        // },
    ];

    const serverListings: ServerListings[] = [
        {
            id: "thousands",
            image: "/images/ServerNavigation/thousandsservercircle.svg",
            alt: "thousands icon",
            notificationCount: 2,
            tooltipLabel: "Thousands",
        },
        //{
        //    id: "wildcard",
        //    image: "/images/ServerNavigation/wildcardservercicle.svg",
        //    alt: "wildcard icon",
        //    notificationCount: 2,
        //    tooltipLabel: "Wildcard Arena",
        //},
        // {
        //     id: "ygg",
        //     image: "/images/ServerNavigation/yggservercircle.svg",
        //     alt: "ygg icon",
        //     notificationCount: 2,
        //     tooltipLabel: "Yield Guild Games",
        // },
    ];

    useEffect(() => {
        const serverCode = getServerCodeFromPath(router);
        if (serverCode) {
            setSelectedAsset(serverCode);
        }
    }, [router.asPath]);

    /**
     * Reorder the server listings based on the selected server code (at the top)
     */
    const getOrderedServerListings = () => {
        if (!serverCode) return serverListings;

        return [
            ...serverListings.filter((server) => server.id === serverCode),
            ...serverListings.filter((server) => server.id !== serverCode),
        ];
    };

    /**
     * Render navigation items for the selected tab
     * @param serverListingId - the current elected listing within the server i.e home, events, collections
     * @returns
     */
    const renderNavItems = (serverListingId: string) => {
        if (selectedServerListing !== serverListingId) return null;

        const isCurrentServer = router.asPath.includes(serverListingId);

        const menuInitialAnimation = isCurrentServer
            ? false
            : {
                  opacity: 0,
                  height: 0,
                  overflow: "hidden",
              };

        const menuExitAnimation = isCurrentServer
            ? false
            : {
                  opacity: 0,
                  height: 0,
                  transition: {
                      height: {
                          duration: 0.2,
                          ease: "easeIn",
                      },
                      opacity: {
                          duration: 0.15,
                      },
                  },
              };

        const menuAnimateAnimation = {
            opacity: 1,
            height: "auto",
            transition: {
                height: {
                    duration: 0.3,
                    ease: "easeOut",
                },
                opacity: {
                    duration: 0.2,
                    delay: 0.1,
                },
            },
        };

        const stackInitialAnimation = isCurrentServer ? false : { y: -10 };

        const stackAnimateAnimation = {
            y: 0,
            transition: {
                duration: 0.2,
                ease: "easeOut",
            },
        };

        const stackExitAnimation = isCurrentServer
            ? false
            : {
                  y: -10,
                  transition: {
                      duration: 0.15,
                      ease: "easeIn",
                  },
              };

        const itemInitialAnimation = isCurrentServer
            ? false
            : {
                  scale: 0.95,
                  opacity: 0,
              };

        const itemAnimateAnimation = {
            scale: 1,
            opacity: 1,
            transition: {
                duration: 0.2,
                delay: 0.1,
            },
        };

        const itemExitAnimation = isCurrentServer
            ? false
            : {
                  scale: 0.95,
                  opacity: 0,
                  transition: {
                      duration: 0.15,
                  },
              };

        return (
            <AnimatePresence mode="wait" initial={false} key={serverListingId}>
                {selectedServerListing === serverListingId && (
                    <MotionBox
                        key={`menu-${serverListingId}`}
                        initial={menuInitialAnimation}
                        animate={menuAnimateAnimation}
                        exit={menuExitAnimation}
                    >
                        <MotionVStack
                            align="center"
                            width="100%"
                            spacing={2}
                            pt={4}
                            initial={stackInitialAnimation}
                            animate={stackAnimateAnimation}
                            exit={stackExitAnimation}
                        >
                            {getNavigationRoutes(serverListingId).map(
                                (navItem) => {
                                    const isActive =
                                        router.pathname === navItem.path;
                                    return (
                                        <MotionBox
                                            key={navItem.name}
                                            initial={itemInitialAnimation}
                                            animate={itemAnimateAnimation}
                                            exit={itemExitAnimation}
                                        >
                                            <Link href={navItem.path}>
                                                <Flex
                                                    sx={{
                                                        flexDirection: "column",
                                                        justifyContent:
                                                            "center",
                                                        alignItems: "center",
                                                        cursor: "pointer",
                                                        position: "relative",
                                                        width: "100%",
                                                        py: 1,
                                                        _before: {
                                                            content: '""',
                                                            position:
                                                                "absolute",
                                                            left: "-8px",
                                                            width: "4px",
                                                            height: isActive
                                                                ? "40px"
                                                                : "8px",
                                                            backgroundColor:
                                                                "white",
                                                            borderRadius:
                                                                "0 4px 4px 0",
                                                            transition:
                                                                "all 0.2s ease",
                                                            opacity: isActive
                                                                ? 1
                                                                : 0,
                                                            transform: isActive
                                                                ? "scale(1)"
                                                                : "scale(0)",
                                                        },
                                                        _hover: {
                                                            _before: {
                                                                opacity: 1,
                                                                height: isActive
                                                                    ? "40px"
                                                                    : "20px",
                                                                transform:
                                                                    "scale(1)",
                                                            },
                                                            "& > *": {
                                                                transform:
                                                                    "scale(1.05)",
                                                            },
                                                        },
                                                    }}
                                                >
                                                    <Box
                                                        position="relative"
                                                        width={
                                                            isActive
                                                                ? "30px"
                                                                : "25px"
                                                        }
                                                        height={
                                                            isActive
                                                                ? "30px"
                                                                : "25px"
                                                        }
                                                        transition="all 0.2s"
                                                    >
                                                        <Center>
                                                            <Image
                                                                src={
                                                                    navItem.icon
                                                                }
                                                                alt={
                                                                    navItem.name
                                                                }
                                                                style={{
                                                                    filter: isActive
                                                                        ? "brightness(1)"
                                                                        : "brightness(0.7)",
                                                                }}
                                                                width="20px"
                                                                height="20px"
                                                            />
                                                        </Center>
                                                    </Box>
                                                    <Text
                                                        sx={{
                                                            fontSize: "10px",
                                                            color: isActive
                                                                ? "white"
                                                                : "gray",
                                                            transition:
                                                                "color 0.2s",
                                                            mt: 1,
                                                        }}
                                                    >
                                                        {navItem.name}
                                                    </Text>
                                                </Flex>
                                            </Link>
                                        </MotionBox>
                                    );
                                }
                            )}
                        </MotionVStack>
                    </MotionBox>
                )}
            </AnimatePresence>
        );
    };

    const renderAssets = () => {
        return getOrderedServerListings().map((asset) => (
            <Box
                key={asset.id}
                minW="50px"
                bg={selectedServerListing === asset.id ? "#212121" : "unset"}
                p="5px"
                borderRadius="lg"
                pt="5px"
            >
                <Tooltip
                    label={asset.tooltipLabel}
                    placement="right"
                    hasArrow
                    bg="gray.900"
                    color="white"
                    openDelay={300}
                    px={3}
                    py={2}
                    rounded="md"
                    fontSize="sm"
                    isDisabled={selectedServerListing === asset.id}
                >
                    <Center>
                        <Box
                            position="relative"
                            w="45px"
                            h="45px"
                            onClick={() => {
                                if (selectedServerListing !== asset.id) {
                                    setSelectedAsset(asset.id);
                                }
                            }}
                            _hover={{
                                "> div": {
                                    transform: "scale(1.05)",
                                },
                            }}
                        >
                            <Circle
                                size="50px"
                                color="white"
                                cursor="pointer"
                                transition="all 0.2s"
                            >
                                <Image
                                    src={asset.image}
                                    alt={asset.alt}
                                    height="40px"
                                    width="40px"
                                />
                            </Circle>
                            {/* {asset.notificationCount && (
                                <NotificationBadge
                                    count={asset.notificationCount}
                                />
                            )} */}
                        </Box>
                    </Center>
                </Tooltip>
                {renderNavItems(asset.id)}
            </Box>
        ));
    };
    return (
        <Flex
            direction="column"
            h="100%"
            w="80px"
            py={4}
            px={2}
            align="center"
            alignSelf="flex-start"
            role="navigation"
            zIndex={1000}
            position="relative"
            _before={{
                content: '""',
                position: "absolute",
                left: 0,
                top: 0,
                width: "2px",
                height: "100%",
                backgroundColor: "whiteAlpha.200",
            }}
            bg="black"
            pt="20px"
        >
            <VStack spacing={4} align="center" w="full">
                {renderAssets()}
                <Tooltip
                    label="Add a Server"
                    placement="right"
                    hasArrow
                    color="white"
                    openDelay={300}
                    px={3}
                    py={2}
                    rounded="md"
                    fontSize="sm"
                    bg="blackAlpha.900"
                >
                    <Circle
                        size="40px"
                        border="1px solid"
                        color="whiteAlpha.500"
                        cursor="pointer"
                        transition="all 0.2s"
                        _hover={{
                            transform: "scale(1.05)",
                        }}
                    >
                        <Icon as={FaPlus} boxSize={4} />
                    </Circle>
                </Tooltip>
            </VStack>
        </Flex>
    );
};

export default ServerNavigation;
