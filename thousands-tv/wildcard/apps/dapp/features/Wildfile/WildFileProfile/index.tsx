import React, { useContext, useEffect, useState } from "react";
import {
    FEATURE_RELEASE,
    FETCH_PFPS_ENDPOINT,
    NUM_ACTIVITIES_DISPLAYED,
    THEME_COLOR_DARK_GOLD,
} from "@/constants/constants";
import { getTimeDifference } from "@/utils/util";
import {
    Flex,
    Box,
    Text,
    Grid,
    GridItem,
    HStack,
    Circle,
    Icon,
    Wrap,
    Tooltip,
    Center,
    useDisclosure,
    Container,
    Hide,
    AccordionButton,
    AccordionIcon,
    AccordionPanel,
    TabPanels,
    TabPanel,
    Tabs,
    useToast,
    Image,
} from "@chakra-ui/react";
import { getBlockExplorerTxUrl } from "@/utils/blockchainUtil";
import { AvatarBackgroundGlow } from "./Main/AvatarImage";
import { useAccount } from "wagmi";
import {
    gilroyMedium,
    poppinsBold,
    poppinsBoldItalic,
} from "@/utils/themeUtil";
import { useGlobalContext } from "@/contexts/globalContext";
import Link from "next/link";
import ShowdownExhibition from "./Main/ShowdownExhibition";
import { decimalToHexColor } from "@/utils/discordUtils";
import { getShowdownFeatureEnabled } from "@/utils/environmentUtil";
import ProfileContext from "../WildfileContext";
import * as styles from "./styles";
import { AiOutlineInfoCircle } from "react-icons/ai";
import {
    wildpassTraitColorsMap,
    getColorMatchOfOwnedWildpassTraitColorsObj,
    getAllowedThemeColorObjectByColorName,
    alabasterColorObj,
} from "@/utils/wildpassUtil";
import AvatarCollection from "./Main/AvatarCollection";
import WildpassCollection from "./Main/Collections/WildpassCollection";
import { AddIconUIButton } from "@/components/Buttons";
import { checkPageOwnerUser, getUserPfp } from "@/utils/userUtil";
import {
    AccountProvider,
    ActivityLog,
    IStage,
    IUser,
    PfpMetadata,
    Point,
    WildcardApiResponse,
} from "@repo/interfaces";
import { RenderSocialIcon } from "./Main/LinkSocialsModal/LinkSocialsCard";
import Accordion from "@/components/Accordion";
import { Network, OwnedNft } from "alchemy-sdk";
import axios from "axios";
import WildfileNavigation from "./WildfileNavigation/index";
import { getUserIdProfileRoute } from "@/utils/routeUtil";
import Showcase from "./Showcase";
import { useRouter } from "next/router";
import WildfileTabList from "./WildfileNavigation/WildfileTabList";
import Leaderboard from "./Leaderboard";
import MyRanking from "./Leaderboard/MyRanking";
import Badge from "./Badge";
import BadgeCollection from "./Main/Collections/BadgeCollection";
import {
    getDiscordAccountByUserDB,
    mapErrorToMessage,
} from "@/utils/accountsUtil";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { ColorObject } from "@/types";
import Points from "./Points";
import Silhoutte from "@/public/images/WildfileAssets/silhoutte.webp";
import EventSchedule from "@/features/Wildfile/WildFileProfile/Main/EventSchedule";

export const claimWildfileButton = {
    marginTop: 1,
    color: "white.500",
    backgroundColor: THEME_COLOR_DARK_GOLD,
    fontSize: {
        base: "xs",
        md: "xs",
        lg: "xs",
        xl: "sm",
        "2xl": "md",
    },
    _hover: { opacity: 0.8 },
    borderWidth: "3px",
    minWidth: { md: 44, lg: 36, xl: 44, "2xl": 36 },
    borderColor: THEME_COLOR_DARK_GOLD,
    fontWeight: 900,
    height: { lg: 6, "2xl": 8 },
};

export enum WildfileTabsEnum {
    MAIN = "main",
    EVENT = "event",
    STORE = "store",
    CHATS = "chats",
    SHOWCASE = "showcase",
    LEADERBOARD = "leaderboard",
    BADGE = "badge",
}

interface UserWildFileProfileProps {
    activeTab: number;
    userDB: IUser;
    connectedUserDBProviderId: string;
    connectedUserDBEmail: string | null;
    events: IStage[];
    points: Point[];
}

// Thousands account Profile Page
const UserWildFileProfile = ({
    activeTab,
    userDB,
    connectedUserDBProviderId,
    connectedUserDBEmail,
    events,
    points,
}: UserWildFileProfileProps) => {
    const { address } = useAccount();
    const { loggedIn } = useGlobalContext();
    const toast = useToast();
    const router = useRouter();

    const { setUserDB, setConnectedUserDBProviderId, setConnectedUserDBEmail } =
        useWildfileUserContext();

    useEffect(() => {
        setUserDB(userDB);
        setConnectedUserDBProviderId(connectedUserDBProviderId);
        if (connectedUserDBEmail) {
            // only set email if it exists (as user can sign in with just a wallet)
            setConnectedUserDBEmail(connectedUserDBEmail);
        }
    }, [userDB]);

    // Display toast message based on the error query parameter
    useEffect(() => {
        const errorMsg = router.query.error;
        if (errorMsg) {
            toast({
                title: "Something went wrong:",
                description: mapErrorToMessage(errorMsg),
                status: "error",
                duration: 9000,
                isClosable: true,
                position: "top",
            });
        }
    }, [router]);

    const {
        pageOwnerUser,
        swagPins,
        userActivity,
        userDiscordRoles,
        wildpasses,
        totalUniqueSwagPins,
        badges,
        setActiveWildfileTab,
        activeWildfileTab,
        setSelectedBadge,
        selectedBadge,
    } = useContext(ProfileContext);

    const isUserMigrationFlowEnabled =
        router.query.userMigrationFlow === "true";

    // handles open/closing of link socials modal
    const linkSocialsDisclosure = useDisclosure();

    const isOwner = checkPageOwnerUser(loggedIn, address, pageOwnerUser);

    const showPrivateInfo = pageOwnerUser?.preferences?.showLinkedSocials;

    const isAllSocialsLinked =
        pageOwnerUser?.twitchProvider?.id &&
        pageOwnerUser?.twitchProvider?.name;

    // get Discord account from user db / accounts system
    const discordAccount: AccountProvider | null =
        getDiscordAccountByUserDB(userDB);
    const isDiscordAccountLinked = !!discordAccount?.id;

    const getDiscordProfile = () => {
        if (pageOwnerUser?.discordProvider?.id) {
            return `https://discordapp.com/users/${pageOwnerUser.discordProvider.id}`;
        }
        return "";
    };
    // get color object
    const themeColorObj = getAllowedThemeColorObjectByColorName(
        pageOwnerUser?.preferences?.avatarThemeColor || alabasterColorObj
    );

    const [avatarThemeColor, setAvatarThemeColor] = useState(themeColorObj);
    const [isPfpsLoading, setIsPfpsLoading] = useState(false);
    const [accountProviderPfps, setAccountProviderPfps] = useState<
        PfpMetadata[]
    >([]);
    const [nftPfps, setNftPfps] = useState<OwnedNft[]>([]);
    const [totalPfpCount, setTotalPfpCount] = useState(0);
    const [nextPageKeys, setNextPageKeys] = useState<Record<string, string>>(
        {}
    );
    const [pfpSelected, setPfpSelected] = useState<PfpMetadata>(
        getUserPfp(userDB)
    );

    const pfp: PfpMetadata = getUserPfp(pageOwnerUser);

    // useDisclosure specifically for New Feature Modal
    const { onOpen } = useDisclosure();

    /**
     * Handle open new feature modal if FEATURE_RELEASE flag is not db
     */
    const handleFeatureRelease = async () => {
        if (
            loggedIn &&
            pageOwnerUser &&
            pageOwnerUser?.walletProvider?.address &&
            (pageOwnerUser?.latestFeatureRelease || 0) < FEATURE_RELEASE
        ) {
            onOpen();
            axios.post("/api/updateFeatureRelease/");
        }
    };

    useEffect(() => {
        if (!pageOwnerUser) {
            return;
        }
        const avatarThemeColorObj = getAllowedThemeColorObjectByColorName(
            pageOwnerUser?.preferences?.avatarThemeColor
        );

        if (!avatarThemeColorObj) {
            return;
        }

        setAvatarThemeColor(avatarThemeColorObj);
        // Check if the user has seen the most recent changes
        handleFeatureRelease();
    }, [pageOwnerUser]);

    // Redirect user to 'main' tab regardless you have empty tab string or string not part of WildfileTabsEnum
    useEffect(() => {
        const { tab } = router.query;
        const wildfileTab = Object.values(WildfileTabsEnum)[activeTab];
        if (wildfileTab !== tab && pageOwnerUser?._id) {
            router.push(
                `${getUserIdProfileRoute(
                    pageOwnerUser._id.toString()
                )}?tab=${wildfileTab}`,
                undefined,
                { shallow: true }
            );
        }

        // Check if the user has seen the most recent changes
        handleFeatureRelease();
    }, [loggedIn]);

    /**
     * Return text label jsx
     * @param smSize - whether this is a smaller font top label or not
     * @param text - text to display
     * @param color - color of text
     * @returns JSX
     */
    const renderLabel = (smSize: boolean, text: string, color?: string) => {
        const className = smSize
            ? poppinsBold.className
            : poppinsBoldItalic.className;
        return (
            <>
                <Text sx={styles.labelSx(smSize, color)} className={className}>
                    {text}
                </Text>
            </>
        );
    };

    /**
     * Fetch all owner's nft from collection of address
     */

    const fetchPfps = async (
        network: Network
    ): Promise<WildcardApiResponse> => {
        try {
            const body = {
                nextPageKeys,
                networks: [network],
            };
            const response = await axios.post(FETCH_PFPS_ENDPOINT, body);
            return response.data;
        } catch (error) {
            console.error(`Error fetching PFPs for network ${network}:`, error);
            return { success: false, data: {} };
        }
    };

    /**
     * Fetch all owner's nft from collection of address and store the states
     */
    const handleFetchPfps = async () => {
        setIsPfpsLoading(true);
        if (!address || !userDB) {
            setAccountProviderPfps([]);
            setNftPfps([]);
            setTotalPfpCount(0);
            setNextPageKeys({});
            setIsPfpsLoading(false);
            return;
        }

        const networks = [Network.ETH_MAINNET, Network.MATIC_MAINNET];

        try {
            const response = await axios.post(FETCH_PFPS_ENDPOINT, {
                nextPageKeys,
                networks,
            });

            const { data, success } = response.data as WildcardApiResponse;
            if (!success) {
                setAccountProviderPfps([]);
                setNftPfps([]);
                setTotalPfpCount(0);
                setNextPageKeys({});
                setIsPfpsLoading(false);
                return;
            }

            const {
                accountProviderPfps: apPfps,
                nftPfps: nPfps,
                pageKeys,
                totalCount,
            } = data;

            setAccountProviderPfps(apPfps);
            setNftPfps(nPfps);
            setTotalPfpCount(totalCount);
            setNextPageKeys(pageKeys);
        } catch (error) {
            console.error("Error fetching PFPs:", error);
            setAccountProviderPfps([]);
            setNftPfps([]);
            setTotalPfpCount(0);
            setNextPageKeys({});
        } finally {
            setIsPfpsLoading(false);
        }
    };

    /**
     * Content for top of page containing id and username
     * @returns JSX
     */
    const renderHeaderContent = () => {
        if (!pageOwnerUser) {
            return null;
        }

        return (
            <Flex w="100%" justifyContent={"space-between"}>
                {showPrivateInfo && (
                    <Flex sx={styles.subHeaderDiscordUsernameSx}>
                        {renderLabel(
                            true,
                            "FANBASE ID",
                            avatarThemeColor.hexValue
                        )}
                        <Box sx={styles.subHeaderBoxTextSx}>
                            {getDiscordProfile() ? (
                                <Link
                                    href={getDiscordProfile()}
                                    target="_blank"
                                >
                                    <Box sx={styles.discordTagSx}>
                                        {renderLabel(
                                            false,
                                            pageOwnerUser?.preferences
                                                ?.displayName ||
                                                "No Display Name Set"
                                        )}
                                    </Box>
                                </Link>
                            ) : (
                                <Box sx={styles.discordTagSx}>
                                    {renderLabel(
                                        false,
                                        pageOwnerUser?.preferences
                                            ?.displayName ||
                                            "No Display Name Set"
                                    )}
                                </Box>
                            )}
                        </Box>
                    </Flex>
                )}
            </Flex>
        );
    };

    /**
     * Pulls discord roles from backend and renders the top 3 roles associated with the user
     * @returns JSX
     */
    const renderDiscordRoles = () => {
        //  check also discord roles is not empty or undefined
        if (!userDiscordRoles || userDiscordRoles.length === 0) {
            return <Text sx={styles.noRolesFoundTextSx}>No roles found</Text>;
        }

        const renderDiscordRolesGrid = userDiscordRoles.map((role) => {
            return (
                <GridItem key={role.id}>
                    <HStack sx={styles.rolesHStackSx}>
                        <Icon
                            as={Circle}
                            size="xs"
                            bg={decimalToHexColor(role.color)}
                        />
                        <Text>{role.name}</Text>
                    </HStack>
                </GridItem>
            );
        });

        return (
            <Flex sx={styles.topDiscordRolesSx}>
                <Center>
                    <Text
                        casing={"uppercase"}
                        sx={styles.backgroundThemeTextColorSx(avatarThemeColor)}
                    >
                        Top Discord Roles
                    </Text>
                </Center>
                <Grid>
                    <Wrap justify={["center", "start"]}>
                        {renderDiscordRolesGrid}
                    </Wrap>
                </Grid>
            </Flex>
        );
    };

    /**
     * Displays stack of latest activities jsx
     * @returns stack of latest activities
     */
    const latestUserActivityJsx = () => {
        const latestUserActivity = userActivity.slice(
            0,
            Math.min(NUM_ACTIVITIES_DISPLAYED, userActivity.length)
        );
        return latestUserActivity.map((event: ActivityLog) => {
            return (
                <HStack key={`${event.type}_${event.time}`}>
                    <Box
                        className={gilroyMedium.className}
                        sx={styles.activityNameSx}
                    >
                        {`${event.type}`}
                        <Text sx={styles.activityTimeSx}>
                            ({getTimeDifference(event.time)})
                        </Text>
                    </Box>
                </HStack>
            );
        });
    };

    /**
     * Shows latest user activity
     * @returns JSX
     */
    const renderUserActivity = () => {
        return (
            <Accordion>
                <AccordionButton sx={styles.accordionButton}>
                    <Text
                        sx={styles.backgroundThemeTextColorSx(avatarThemeColor)}
                        casing="uppercase"
                        className={poppinsBold.className}
                    >
                        Latest Activity
                    </Text>
                    <AccordionIcon />
                </AccordionButton>
                <AccordionPanel p={0}>
                    <Flex sx={styles.userActivityVStackSx}>
                        {latestUserActivityJsx()}
                    </Flex>
                </AccordionPanel>
            </Accordion>
        );
    };

    /**
     * Shows my ranking in the leaderboard
     * @returns JSX
     */
    const renderMyRankingLeaderboard = () => {
        return (
            <Accordion>
                <AccordionButton sx={styles.accordionButton}>
                    <Text
                        sx={styles.backgroundThemeTextColorSx(avatarThemeColor)}
                        casing="uppercase"
                        className={poppinsBold.className}
                    >
                        Leaderboards
                    </Text>
                    <AccordionIcon />
                </AccordionButton>
                <AccordionPanel p={0}>
                    <Flex sx={styles.leaderboardSx}>
                        <MyRanking isFitToAccordion={true} />
                    </Flex>
                </AccordionPanel>
            </Accordion>
        );
    };

    /**
     * Shows my points
     * @returns JSX
     */
    const renderMyPointsLeaderboard = () => {
        return (
            <Accordion>
                <AccordionButton sx={styles.accordionButton}>
                    <Text
                        sx={styles.backgroundThemeTextColorSx(avatarThemeColor)}
                        casing="uppercase"
                        className={poppinsBold.className}
                    >
                        My Points
                    </Text>
                    <AccordionIcon />
                </AccordionButton>
                <AccordionPanel p={0}>
                    <Flex sx={styles.pointsSx}>
                        <Points points={points} />
                    </Flex>
                </AccordionPanel>
            </Accordion>
        );
    };

    /**
     * user details about wallet address and linked accounts
     * @returns JSX
     */
    const renderUserDetails = () => {
        if (isOwner || showPrivateInfo) {
            return (
                <Box sx={styles.boxAccordionWrapperSx}>
                    <Accordion>
                        <AccordionButton sx={styles.accordionButton}>
                            <Text
                                sx={styles.backgroundThemeTextColorSx(
                                    avatarThemeColor
                                )}
                                casing="uppercase"
                            >
                                {"Socials"}
                            </Text>
                            <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel p={0}>
                            <Flex sx={styles.userDetailsSx}>
                                <HStack>{renderUILinkedSocial()}</HStack>
                            </Flex>
                        </AccordionPanel>
                    </Accordion>
                </Box>
            );
        }

        return <></>;
    };

    /**
     * Renders Social Modal Button to Add or Show Socials
     * @returns JSX Button to instantiate social modal pop up
     */
    const renderAddSocialsModalButton = () => {
        // @todo - appears to cause an infinite loop
        // const isWildfileOwner = getIsWildfileOwner(userDB);

        // if (!isWildfileOwner) {
        //     return null;
        // }

        if (!isOwner) {
            return showPrivateInfo ? (
                <AddIconUIButton
                    id={"ga-wildfile-button-add-socials"}
                    text={"Show Socials"}
                    showIcon={false}
                    onClick={linkSocialsDisclosure.onOpen}
                />
            ) : (
                <> </>
            );
        }

        return (
            <AddIconUIButton
                id={"ga-wildfile-button-add-socials"}
                text={isAllSocialsLinked ? "Show Socials" : "Add Socials"}
                showIcon={isAllSocialsLinked ? false : true}
                onClick={linkSocialsDisclosure.onOpen}
            />
        );
    };

    /**
     * Render linked socials component showing all linked socials icons and button modal
     * @returns JSX
     */
    const renderUILinkedSocial = () => {
        return (
            <Flex sx={styles.linkedSocialsRowSx}>
                <RenderSocialIcon user={pageOwnerUser} social="twitch" />
                <RenderSocialIcon user={pageOwnerUser} social="twitter" />
                <RenderSocialIcon user={pageOwnerUser} social="farcaster" />

                <Box>{renderAddSocialsModalButton()}</Box>
            </Flex>
        );
    };

    // Render showdown exhibition and event schedule table
    const renderWildfileShowdown = () => {
        if (!getShowdownFeatureEnabled()) {
            return null;
        }

        return (
            <>
                <ShowdownExhibition />
                <EventSchedule />
            </>
        );
    };

    /**
     * Renders a rainbow text of the word "WILDPASS" with each character color-matched based on the wildpass trait colors the user owns.
     * @returns JSX element of the rainbow text.
     */
    const renderWildpassTraitColorRainbow = () => {
        const wildpassText: string = "WILDPASS";

        // Get the colors of the wildpass trait colors the user owns.
        const matchedColors =
            getColorMatchOfOwnedWildpassTraitColorsObj(wildpasses);

        const wildpassCollectibleCount =
            `(${matchedColors.length}/${wildpassTraitColorsMap.length})` ||
            "(0/8)";

        const toolTipMsg = (
            <>
                You own: {wildpassCollectibleCount} Wildpass trait colors.
                <br />
                Each character of the word &rsquo;WILDPASS&rsquo; is colored
                based on the wildpass trait colors you own!
            </>
        );

        // Render the rainbow text color-matched to the wildpass trait colors the user owns.
        const renderWildpassTextRainbow = () => {
            if (matchedColors.length < 1 || !matchedColors) {
                return (
                    <Text color="white" display="inline-block">
                        {wildpassText}
                    </Text>
                );
            } else {
                return Array.from(wildpassText).map((char, index) => {
                    const colorObj = wildpassTraitColorsMap[index];
                    const color =
                        colorObj &&
                        matchedColors.some(
                            (color) => color.hexValue === colorObj.hexValue
                        )
                            ? colorObj.hexValue
                            : "white";
                    return (
                        <Text key={index} color={color} display="inline-block">
                            {char}
                        </Text>
                    );
                });
            }
        };

        // Return the JSX element of the rainbow text with a tooltip (explanation)
        return (
            <Flex sx={styles.wildpassRainbowColorSx}>
                <Box
                    sx={styles.backgroundThemeTextColorSx(avatarThemeColor)}
                    className={poppinsBold.className}
                >
                    {renderWildpassTextRainbow()}{" "}
                    {`Collection ${wildpassCollectibleCount}`}
                </Box>
                <Tooltip label={toolTipMsg} sx={styles.toolTip}>
                    <Box ml={1}>
                        <Icon
                            as={AiOutlineInfoCircle}
                            sx={styles.wildpassCollectionInfoIcon}
                            aria-label={"more info"}
                        />
                    </Box>
                </Tooltip>
            </Flex>
        );
    };

    // Number of badges acquired so far
    const displayBadgeCollectionCount = () => {
        const ownedBadges: number = badges.reduce((count, badge) => {
            return badge.userIds.includes(pageOwnerUser._id?.toString() || "")
                ? ++count
                : count;
        }, 0);

        return ` (${ownedBadges}/${badges.length})`;
    };

    const [imageLoaded, setImageLoaded] = useState<boolean>(false);

    /**
     * Change to new tab
     * @param newProfileTab new index tab
     */
    const handleChangeWildfileTab = (newProfileTab: number) => {
        setActiveWildfileTab(newProfileTab);
        const wildfileTab = Object.values(WildfileTabsEnum)[newProfileTab];
        if (pageOwnerUser?._id) {
            router.push(
                `${getUserIdProfileRoute(
                    pageOwnerUser._id.toString()
                )}?tab=${wildfileTab}`,
                undefined,
                { shallow: true }
            );
        }
    };

    /**
     * Render Showcase component
     * @returns Showcase jsx component
     */
    const renderShowcaseJsx = () => {
        return (
            <Box id="collections-container">
                <Showcase avatarThemeColor={avatarThemeColor} />
            </Box>
        );
    };

    const renderLeaderboardJsx = () => {
        return (
            <Box id="leaderboard-container">
                <Leaderboard
                    avatarThemeColor={avatarThemeColor}
                    setImageLoaded={setImageLoaded}
                    imageLoaded={imageLoaded}
                />
            </Box>
        );
    };

    const renderBadgeJsx = () => {
        return (
            <Box id="badge-container">
                <Badge
                    avatarThemeColor={avatarThemeColor}
                    setSelectedBadge={setSelectedBadge}
                    selectedBadge={selectedBadge}
                />
            </Box>
        );
    };

    // Render tab list component
    const renderTabList = () => {
        if (router.pathname === "/userId/[userId]") {
            return <WildfileTabList avatarThemeColor={avatarThemeColor} />;
        }

        return null;
    };

    const renderWildfileJsx = () => {
        return (
            <Box id="profile-main" sx={styles.profileMainSx}>
                {/* Render Profile Contents */}
                <Hide below="lg">
                    <Box sx={styles.profileHeaderSx}>
                        {renderHeaderContent()}
                    </Box>
                </Hide>
                {/* Profile Avatar Page Contents */}
                <Flex sx={styles.pageContentsSx}>
                    {/* Profile Text Contents */}
                    <Flex sx={styles.pageContentsLeftSx}>
                        <Flex
                            id="profile-details"
                            sx={styles.profileDetailsSx(isOwner)}
                        >
                            <Hide above="lg">
                                <Box ml="20px">{renderHeaderContent()}</Box>{" "}
                            </Hide>
                            <Box>
                                {showPrivateInfo ? (
                                    <>{renderDiscordRoles()}</>
                                ) : null}
                            </Box>
                            <Box sx={styles.boxAccordionWrapperSx}>
                                <Accordion>
                                    <AccordionButton
                                        sx={styles.accordionButton}
                                    >
                                        {renderWildpassTraitColorRainbow()}
                                        <AccordionIcon />
                                    </AccordionButton>
                                    <AccordionPanel p={0}>
                                        <WildpassCollection />
                                    </AccordionPanel>
                                </Accordion>
                            </Box>
                            <Box sx={styles.boxAccordionWrapperSx}>
                                <Accordion>
                                    <AccordionButton
                                        sx={styles.accordionButton}
                                    >
                                        <Text
                                            sx={styles.backgroundThemeTextColorSx(
                                                avatarThemeColor
                                            )}
                                            casing="uppercase"
                                            className={poppinsBold.className}
                                        >
                                            {`Badge Collection ${displayBadgeCollectionCount()}`}
                                        </Text>
                                        <AccordionIcon />
                                    </AccordionButton>
                                    <AccordionPanel p={0}>
                                        <BadgeCollection
                                            setSelectedBadge={setSelectedBadge}
                                            handleChangeWildfileTab={
                                                handleChangeWildfileTab
                                            }
                                        />
                                    </AccordionPanel>
                                </Accordion>
                            </Box>
                            <Box sx={styles.boxAccordionWrapperSx}>
                                {renderMyPointsLeaderboard()}
                            </Box>
                            <Box sx={styles.boxAccordionWrapperSx}>
                                {renderMyRankingLeaderboard()}
                            </Box>
                            <Box sx={styles.boxAccordionWrapperSx}>
                                {renderUserActivity()}
                            </Box>

                            {renderUserDetails()}
                        </Flex>
                    </Flex>

                    {/* Avatar PFP Image */}
                    {/* Avatar & Edit Component */}
                    <Flex sx={styles.pageContentsRightSx}>
                        {/* Debug avatar positioning */}
                        <Flex sx={styles.avatarBoxSx(isOwner)}>
                            <Image
                                alt="account logo"
                                src={Silhoutte.src}
                                sx={styles.avatarRadiusFullCircleSx}
                            />

                            <Box>
                                <AvatarCollection
                                    setAvatarThemeColor={setAvatarThemeColor}
                                    avatarThemeColor={avatarThemeColor}
                                    handleFetchPfps={handleFetchPfps}
                                    fetchPfps={fetchPfps}
                                    accountProviderPfps={accountProviderPfps}
                                    nftPfps={nftPfps}
                                    setNftPfps={setNftPfps}
                                    totalPfpCount={totalPfpCount}
                                    nextPageKeys={nextPageKeys}
                                    setNextPageKeys={setNextPageKeys}
                                    isPfpsLoading={isPfpsLoading}
                                    pfpSelected={pfpSelected}
                                    setPfpSelected={setPfpSelected}
                                    showEditIcon={true}
                                />
                            </Box>
                        </Flex>
                    </Flex>
                </Flex>
            </Box>
        );
    };

    const renderAvatarBackgroundOverlay = () => {
        return (
            <Box sx={styles.avatarBackgroundGlowWrapperSx}>
                <AvatarBackgroundGlow avatarThemeColor={avatarThemeColor} />
            </Box>
        );
    };

    return (
        <Container centerContent sx={styles.parentContainerSx}>
            {/* Render Profile Inner Contents */}
            <Flex sx={styles.parentFlexSx}>
                <Tabs
                    sx={styles.tabSx}
                    index={activeWildfileTab}
                    onChange={handleChangeWildfileTab}
                    size="lg"
                    isLazy={false}
                >
                    <WildfileNavigation avatarThemeColor={avatarThemeColor} />
                    <Flex sx={styles.parentPageContentAlignment}>
                        <Hide breakpoint="(max-width: 1400px)">
                            <Box sx={styles.tabWrapperSx}>
                                {renderTabList()}
                            </Box>
                        </Hide>

                        <TabPanels sx={styles.tabPanelsSx}>
                            <TabPanel>{renderWildfileJsx()}</TabPanel>
                            <TabPanel></TabPanel>
                            <TabPanel></TabPanel>
                            <TabPanel></TabPanel>
                            <TabPanel>{renderShowcaseJsx()}</TabPanel>
                            <TabPanel>{renderLeaderboardJsx()}</TabPanel>
                            <TabPanel>{renderBadgeJsx()}</TabPanel>
                        </TabPanels>
                    </Flex>
                </Tabs>
                {renderAvatarBackgroundOverlay()}
            </Flex>
            {renderWildfileShowdown()}
        </Container>
    );
};
export default UserWildFileProfile;
