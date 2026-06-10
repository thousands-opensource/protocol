import { useContext } from "react";
import {
    Box,
    HStack,
    Flex,
    Grid,
    GridItem,
    Text,
    Image,
    useToast,
    Tooltip,
    Hide,
} from "@chakra-ui/react";
import * as styles from "./styles";
import ProfileContext from "@/features/Wildfile/WildfileContext";
import { getSwagPinMagicEdenLink } from "@/utils/util";
import { VERTICAL_COLLECT_THEM_ALL_SHOWCASE } from "@/constants/swagpins";
import { getTotalSwagOwnedInSet } from "@/utils/userUtil";
import { gilroyBold, gilroyRegular } from "@/utils/themeUtil";
import { SwagSetStyle } from "..";
import router from "next/router";
import { WildfileTabsEnum } from "../..";
import { getBadgeImagePathBySwagSetTitle } from "@/utils/badgeUtil";
import { IBadge, ISwagSet } from "@repo/interfaces";
import { getUserIdProfileRoute } from "@/utils/routeUtil";

const PreAlpha = () => {
    const {
        swagSets,
        swagPins,
        pageOwnerUser,
        claimedSwagSets,
        setActiveWildfileTab,
        badges,
        setSelectedBadge,
    } = useContext(ProfileContext);
    const toast = useToast();

    /**
     * Render a collection header
     * @param swagSet swag collection to show
     * @returns collection header title, swags collected, and claim wildevent jsx
     */
    const renderCollectionHeader = (swagSet: ISwagSet) => {
        const totalOwned = getTotalSwagOwnedInSet(swagSet, swagPins);
        return (
            <HStack sx={styles.collectionHeaderSx}>
                <Box w="100%">
                    <Text
                        casing="uppercase"
                        className={gilroyBold.className}
                        sx={styles.collectionHeaderTitleSx}
                    >
                        {swagSet.title}
                    </Text>
                    <Text
                        sx={styles.totalOwnedTextSx}
                        className={gilroyRegular.className}
                    >
                        ({totalOwned}/{swagSet.tokenIds.length})
                    </Text>
                </Box>
            </HStack>
        );
    };

    /**
     * Render a collection body
     * @param swagSet swag collection to show
     * @param swagSetStyle swag collection unique styles
     * @returns card-like collectible component jsx
     */
    const renderCollectionBody = (
        swagSet: ISwagSet,
        swagSetStyle: SwagSetStyle
    ) => {
        const totalOwned = getTotalSwagOwnedInSet(swagSet, swagPins);
        const completedSet = totalOwned === swagSet.tokenIds.length;

        return (
            <HStack
                sx={styles.collectionBodyWrapperSx(completedSet, swagSetStyle)}
            >
                <Flex sx={styles.collectionBodySx}>
                    {renderLeftPanel(completedSet, swagSetStyle, swagSet)}
                    {renderRightPanel(swagSet, swagSetStyle)}
                </Flex>
            </HStack>
        );
    };

    /**
     * Render left panel of a collection body
     * @param completedSet specifies set is completed or not
     * @param swagSetStyle swag collection unique styles
     * @param swagSet swag collection to show
     * @returns image of a pre alpha collection
     */
    const renderLeftPanel = (
        completedSet: boolean,
        swagSetStyle: SwagSetStyle,
        swagSet: ISwagSet
    ) => {
        const badgeSrc = getBadgeImagePathBySwagSetTitle(swagSet.title);
        const getBadgeBySwagSetTitle = (
            swagSetTitle: string,
            badges: IBadge[]
        ): IBadge | null => {
            return (
                badges.find((badge) => badge.swagSetTitle === swagSetTitle) ||
                null
            );
        };

        /**
         * Handle switching to badges tab and highlighting the selected badge
         * @param newProfileTab - new profile tab to highlight
         * @param swagSetTitle - swag set title of the badge to highlight
         */
        const handleChangeWildfileTabToSelectedBadge = (
            newProfileTab: number,
            swagSetTitle: string
        ) => {
            setActiveWildfileTab(newProfileTab);
            const targetBadge =
                getBadgeBySwagSetTitle(swagSetTitle, badges) || badges[0];
            setSelectedBadge(targetBadge);

            const wildfileTab = Object.values(WildfileTabsEnum)[newProfileTab];
            router.push(
                `${getUserIdProfileRoute(
                    pageOwnerUser._id?.toString() || ""
                )}?tab=${wildfileTab}`,
                undefined,
                { shallow: true }
            );
        };

        return (
            <Flex sx={styles.leftPanelSx}>
                <Hide below="lg">
                    <Image
                        flexGrow={1}
                        alt={"melee"}
                        src={swagSetStyle.leftPanelImageDesktopSrc}
                        sx={styles.imgMediaSx}
                    />
                </Hide>
                <Hide above="lg">
                    <Image
                        flexGrow={1}
                        alt={"melee"}
                        src={swagSetStyle.leftPanelImageMobileSrc}
                        sx={styles.imgMediaSx}
                    />
                </Hide>
                {completedSet && (
                    <Tooltip
                        label={`${swagSet.title} collection is complete! (view badge)`}
                        placement="top"
                        bg="blackAlpha.800"
                        color="white"
                    >
                        <Image
                            position="absolute"
                            alt={"badge"}
                            src={badgeSrc.src}
                            sx={styles.bannerImgSx(swagSetStyle)}
                            onClick={() =>
                                handleChangeWildfileTabToSelectedBadge(
                                    3,
                                    swagSet.title
                                )
                            }
                        />
                    </Tooltip>
                )}
            </Flex>
        );
    };

    /**
     * Render right panel of a collection body
     * @param swagSet swag collection to show
     * @param swagSetStyle swag collection unique styles
     * @returns collection of swag pins
     */
    const renderRightPanel = (
        swagSet: ISwagSet,
        swagSetStyle: SwagSetStyle
    ) => {
        const updateTokenId = (tokenId: string) => {
            let ownsNft = swagPins.some(
                (swagPin) => swagPin.tokenId === tokenId
            );
            switch (tokenId) {
                // case "3":
                //     let ex1PinId: string = tokenId;
                //     const ownsGoldEx1 = swagPins.some(
                //         (swagPin) => swagPin.tokenId === "4"
                //     );
                //     if (ownsGoldEx1) {
                //         ex1PinId = "4"; // Gold
                //         return [ex1PinId, ownsGoldEx1] as const;
                //     }
                //     return [ex1PinId, ownsNft] as const; // Blue

                default:
                    return [tokenId, ownsNft] as const;
            }
        };

        return (
            <Grid
                templateColumns={swagSetStyle.templateColumns}
                templateRows={swagSetStyle.templateRows}
                sx={styles.rightPanelSx(swagSetStyle)}
                id={`grid-${swagSet.title}`}
            >
                {swagSet.tokenIds.map((id, index) => {
                    const [tokenId, ownsNft] = updateTokenId(id);

                    const colSpan =
                        swagSetStyle.colSpan && index === 2
                            ? swagSetStyle.colSpan
                            : 1;

                    return (
                        <GridItem
                            key={tokenId}
                            onClick={() => {
                                window.open(
                                    getSwagPinMagicEdenLink(tokenId),
                                    "_blank"
                                );
                            }}
                            sx={styles.rightPanelGridItemSx}
                            colSpan={colSpan}
                        >
                            <Box sx={styles.pinImgSx(tokenId, ownsNft)} />
                        </GridItem>
                    );
                })}
                {renderCollectThemAll(swagSet, swagSetStyle)}
            </Grid>
        );
    };

    /**
     * Render collect them all image component
     * @param swagSet swag collection to show
     * @param swagSetStyle swag collection unique styles
     * @returns collect them all image component
     */
    const renderCollectThemAll = (
        swagSet: ISwagSet,
        swagSetStyle: SwagSetStyle
    ) => {
        if (!swagSetStyle.collectThemAllSrc) {
            return <></>;
        }

        if (VERTICAL_COLLECT_THEM_ALL_SHOWCASE.includes(swagSet.title)) {
            return (
                <GridItem
                    key={`${swagSet}-collect-them-all`}
                    sx={styles.collectThemAllGridItemSx}
                >
                    <Image
                        alt={`${swagSet}-collect-them-all`}
                        src={swagSetStyle.collectThemAllSrc}
                        sx={styles.collectThemAllSx(swagSetStyle)}
                    />
                </GridItem>
            );
        }

        return (
            <Box sx={styles.collectThemAllGridItemAbsoluteSx(swagSetStyle)}>
                <Image
                    alt={`${swagSet.title}-collect-them-all`}
                    src={swagSetStyle.collectThemAllSrc}
                    sx={styles.collectThemAllAbsoluteSx(swagSetStyle)}
                />
            </Box>
        );
    };

    return swagSets.map((swagSet: ISwagSet, index: number) => {
        if (!swagSet) {
            return <></>;
        }

        // Specific breakpoints styles for specfic collections
        let swagSetStyle = styles.swagSetsStyles[`${swagSet.title}`];
        if (!swagSetStyle) {
            swagSetStyle = styles.genericSwagSetStyle;
        }
        return (
            <Box key={`${swagSet.title}-${index}`}>
                {renderCollectionHeader(swagSet)}
                {renderCollectionBody(swagSet, swagSetStyle)}
            </Box>
        );
    });
};

export default PreAlpha;
