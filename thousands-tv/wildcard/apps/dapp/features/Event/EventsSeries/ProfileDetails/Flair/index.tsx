import {
    Box,
    HStack,
    Flex,
    Grid,
    GridItem,
    Image,
    Hide,
} from "@chakra-ui/react";
import { getSwagPinMagicEdenLink } from "@/utils/util";
import { ISwagSet, PointItem, PointItemCollection } from "@repo/interfaces";
import * as styles from "./styles";
import { VERTICAL_COLLECT_THEM_ALL_SHOWCASE } from "@/constants/flair";

export interface SwagSetStyles {
    [collection: string]: SwagSetStyle;
}

export interface SwagSetStyle {
    backgroundBorderGradient: string;
    leftPanelImageDesktopSrc: string;
    leftPanelImageMobileSrc: string;
    bannerHeight: string;
    templateColumns: string;
    templateRows?: string;
    rightPanelTop?: string | string[];
    rightPanelPaddingY?: string | string[];
    rightPanelHeight: string | string[];
    rightPanelBackgroundSize: string | string[];
    rightPanelBackgroundImageUrl: string | string[];
    colSpan?: number;
    collectThemAllSrc?: string;
    collectThemAllWidth?: string | string[];
    collectThemAllInset?: string | string[];
}

interface FlairProps {
    flair: PointItemCollection;
}

const Flair = ({ flair }: FlairProps) => {
    /**
     * Render a collection body
     * @param swagSet swag collection to show
     * @param swagSetStyle swag collection unique styles
     * @returns card-like collectible component jsx
     */
    const renderCollectionBody = (
        flair: PointItemCollection,
        swagSetStyle: SwagSetStyle
    ) => {
        const getTotalSwagOwnedInSet = (flair: any): number => {
            let total = 0;
            for (const swagFlair of flair.pointItems) {
                if (swagFlair.quantityOwned > 0) {
                    total++;
                }
            }
            return total;
        };
        const totalOwned = getTotalSwagOwnedInSet(flair);
        const isCompletedSet = totalOwned === flair.pointItems.length;

        return (
            <HStack
                sx={styles.collectionBodyWrapperSx(
                    isCompletedSet,
                    swagSetStyle
                )}
            >
                <Flex sx={styles.collectionBodySx}>
                    {renderLeftPanel(swagSetStyle)}
                    {renderRightPanel(flair, swagSetStyle)}
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
    const renderLeftPanel = (swagSetStyle: SwagSetStyle) => {
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
        flair: PointItemCollection,
        swagSetStyle: SwagSetStyle
    ) => {
        // const updateTokenId = (tokenId: string) => {
        //     let ownsNft = swagPins.some(
        //         (swagPin) => swagPin.tokenId === tokenId
        //     );
        //     switch (tokenId) {
        //         default:
        //             return [tokenId, ownsNft] as const;
        //     }
        // };

        return (
            <Grid
                templateColumns={swagSetStyle.templateColumns}
                templateRows={swagSetStyle.templateRows}
                sx={styles.rightPanelSx(swagSetStyle)}
                id={`grid-${flair.name}`}
            >
                {flair.pointItems.map((nftItem: any, index: number) => {
                    const { tokenId, quantityOwned } = nftItem;

                    const isOwned = quantityOwned > 0;

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
                            <Box sx={styles.pinImgSx(tokenId, isOwned)} />
                        </GridItem>
                    );
                })}
                {renderCollectThemAll(flair, swagSetStyle)}
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
        flair: PointItemCollection,
        swagSetStyle: SwagSetStyle
    ) => {
        if (!swagSetStyle.collectThemAllSrc) {
            return <></>;
        }

        if (VERTICAL_COLLECT_THEM_ALL_SHOWCASE.includes(flair.name)) {
            return (
                <GridItem
                    id="grid-collect-them-all"
                    key={`${flair.name}-collect-them-all`}
                    sx={styles.collectThemAllGridItemSx}
                >
                    <Image
                        alt={`${flair.name}-collect-them-all`}
                        src={swagSetStyle.collectThemAllSrc}
                        sx={styles.collectThemAllSx(swagSetStyle)}
                    />
                </GridItem>
            );
        }

        return (
            <Box
                id="box-collect-them-all"
                sx={styles.collectThemAllGridItemAbsoluteSx(swagSetStyle)}
            >
                <Image
                    alt={`${flair.name}-collect-them-all`}
                    src={swagSetStyle.collectThemAllSrc}
                    sx={styles.collectThemAllAbsoluteSx(swagSetStyle)}
                />
            </Box>
        );
    };

    if (!flair) {
        return <></>;
    }

    // Specific breakpoints styles for specfic collections
    let swagSetStyle = styles.swagSetsStyles[`${flair.name}`];
    if (!swagSetStyle) {
        swagSetStyle = styles.genericSwagSetStyle;
    }
    return (
        <Box key={`${flair.name}`}>
            {renderCollectionBody(flair, swagSetStyle)}
        </Box>
    );
};

export default Flair;
