import React, { Dispatch, SetStateAction } from "react";
import {
    Box,
    Flex,
    SimpleGrid,
    Skeleton,
    TabPanel,
    TabPanels,
    Tabs,
    Text,
    Spinner,
    Button,
} from "@chakra-ui/react";
import InfiniteScroll from "react-infinite-scroll-component";
import * as styles from "./styles";
import { ThemeColorSelectGrid } from "../../ThemeColorSelectGrid";
import { ColorObject } from "@/types";
import AvatarTile from "../AvatarTile";
import { Network, OwnedNft } from "alchemy-sdk";
import {
    getImageUrl,
    getPfpCollectionChainId,
} from "@/utils/pfpCollectionUtil";
import { getWildpassSurveyUrl } from "@/utils/environmentUtil";
import {
    AccountProviderType,
    PfpMetadata,
    WildcardApiResponse,
} from "@repo/interfaces";

/**
 * Enum for Avatar Tabs (Custom Tabs)
 */
export enum AvatarTabsEnum {
    AVATAR = "avatar",
    THEME = "theme",
}

/**
 * Get the active tab
 * @param activeTab - the active tab
 * @returns the active tab
 */
export function getAvatarTab(activeTab: AvatarTabsEnum) {
    switch (activeTab) {
        case AvatarTabsEnum.AVATAR:
            return AvatarTabsEnum.AVATAR;
        case AvatarTabsEnum.THEME:
            return AvatarTabsEnum.THEME;
    }
}

/**
 * Interface for the Avatar Collection (Custom Button Tabs)
 */
// Updated AvatarTabsProps
export interface AvatarTabsProps {
    activeTab: AvatarTabsEnum;
    setColorSelected: (color: ColorObject) => void;
    colorSelected: ColorObject;
    nextPageKeys: Record<string, string>;
    setNextPageKeys: Dispatch<SetStateAction<Record<string, string>>>;
    setPfpSelected: Dispatch<SetStateAction<PfpMetadata>>;
    pfpSelected: PfpMetadata;
    setFavoritePfpsSelected: Dispatch<SetStateAction<PfpMetadata[]>>;
    favoritePfpsSelected: PfpMetadata[];
    isPfpsLoading: boolean;
    totalPfpCount: number;
    nftPfps: OwnedNft[];
    setNftPfps: Dispatch<SetStateAction<OwnedNft[]>>;
    accountProviderPfps: PfpMetadata[];
    fetchPfps: (network: Network) => Promise<WildcardApiResponse>;
}

function AvatarTabs({
    activeTab,
    setColorSelected,
    colorSelected,
    setNextPageKeys,
    setPfpSelected,
    pfpSelected,
    setFavoritePfpsSelected,
    favoritePfpsSelected,
    isPfpsLoading,
    totalPfpCount,
    nftPfps,
    setNftPfps,
    accountProviderPfps,
    fetchPfps,
}: AvatarTabsProps) {
    // it tells the Infinite Scroll component on whether to trigger next function on reaching the bottom
    const hasMorePfp =
        nftPfps.length + accountProviderPfps.length < totalPfpCount;

    /**
     * Fetches the next batch of pfps
     */
    const getNextBatchPfps = async () => {
        const networks = [Network.ETH_MAINNET, Network.MATIC_MAINNET];

        try {
            const [ethResp, polygonResp] = await Promise.all(
                networks.map((network) => fetchPfps(network))
            );

            const ethData = ethResp.success
                ? ethResp.data
                : { nftPfps: [], pageKeys: {} };
            const polygonData = polygonResp.success
                ? polygonResp.data
                : { nftPfps: [], pageKeys: {} };

            setNftPfps((prev) => [
                ...prev,
                ...ethData.nftPfps,
                ...polygonData.nftPfps,
            ]);

            setNextPageKeys((prev) => ({
                ...prev,
                ...ethData.pageKeys,
                ...polygonData.pageKeys,
            }));
        } catch (error) {
            console.error("Error fetching next batch of PFPs:", error);
        }
    };

    /**
     * Render default pfp
     * @returns default silhoutte pfp
     */
    const renderDefaultPfp = () => {
        return (
            <AvatarTile
                key={"default"}
                tokenId={"0"}
                name={"default"}
                contractAddress={"0x0000000000000000000000000000000000000000"}
                imageUrl={""}
                accountProviderType={AccountProviderType.WALLET}
                chainId={0}
                setPfpSelected={setPfpSelected}
                pfpSelected={pfpSelected}
                favoritePfpsSelected={favoritePfpsSelected}
                setFavoritePfpsSelected={setFavoritePfpsSelected}
            />
        );
    };

    /**
     * Render PFP favorites component
     * @returns - JSX of favorites pfp component
     */
    const renderFavoritePfps = () => {
        if (favoritePfpsSelected.length === 0) {
            return null;
        }

        return (
            <Box mb={4}>
                <Text sx={styles.avatarFavoritesHeaderTextSx}>Favorites</Text>
                <Skeleton isLoaded={true} sx={styles.skeletonSx}>
                    <Flex sx={styles.avatarFavoriteFlexSx}>
                        <SimpleGrid
                            sx={styles.avatarFavoriteGridSx}
                            templateColumns={[
                                "repeat(3, minmax(0, 1fr))",
                                "repeat(3, 1fr)",
                            ]}
                        >
                            {favoritePfpsSelected.map(
                                (pfp: PfpMetadata, index: number) => {
                                    return (
                                        <AvatarTile
                                            key={`${pfp.tokenId}-${index}`}
                                            tokenId={pfp.tokenId}
                                            name={pfp.name}
                                            imageUrl={pfp.imageUrl}
                                            contractAddress={
                                                pfp.contractAddress
                                            }
                                            chainId={pfp.chainId}
                                            accountProviderType={
                                                pfp.accountProviderType ||
                                                AccountProviderType.WALLET
                                            }
                                            setPfpSelected={setPfpSelected}
                                            pfpSelected={pfpSelected}
                                            favoritePfpsSelected={
                                                favoritePfpsSelected
                                            }
                                            setFavoritePfpsSelected={
                                                setFavoritePfpsSelected
                                            }
                                        />
                                    );
                                }
                            )}
                        </SimpleGrid>
                    </Flex>
                </Skeleton>
            </Box>
        );
    };

    /**
     * Render Avatar PFP selection grid
     * @returns - JSX of PFP selection grid
     */
    const renderAvatarPFPSelectionGrid = () => {
        if (nftPfps.length === 0) return null;

        return (
            <Box>
                <Skeleton isLoaded={!isPfpsLoading} sx={styles.skeletonSx}>
                    <InfiniteScroll
                        dataLength={nftPfps.length}
                        next={getNextBatchPfps}
                        hasMore={nftPfps.length < totalPfpCount}
                        loader={<Spinner size="xl" />}
                    >
                        <SimpleGrid templateColumns={["repeat(3, 1fr)"]}>
                            {nftPfps.map((pfp, index) => (
                                <AvatarTile
                                    key={index}
                                    tokenId={pfp.tokenId}
                                    name={pfp.name || `NFT #${index + 1}`}
                                    contractAddress={pfp.contract.address}
                                    chainId={getPfpCollectionChainId(
                                        pfp.contract.address
                                    )}
                                    imageUrl={getImageUrl(pfp)}
                                    accountProviderType={
                                        AccountProviderType.WALLET
                                    }
                                    setPfpSelected={setPfpSelected}
                                    pfpSelected={pfpSelected}
                                    favoritePfpsSelected={favoritePfpsSelected}
                                    setFavoritePfpsSelected={
                                        setFavoritePfpsSelected
                                    }
                                />
                            ))}
                        </SimpleGrid>
                    </InfiniteScroll>
                </Skeleton>
            </Box>
        );
    };

    const renderAccountProviderPfps = () => {
        if (accountProviderPfps.length === 0) return null;

        return (
            <Box>
                <Text sx={styles.avatarGridHeaderTextSx}>
                    Account Provider PFPs
                </Text>
                <SimpleGrid templateColumns={["repeat(3, 1fr)"]} spacing={4}>
                    {accountProviderPfps.map((pfp, index) => (
                        <AvatarTile
                            key={`account-${index}`}
                            tokenId={pfp.tokenId} // Not applicable for non-nft PFPs
                            name={pfp.name}
                            contractAddress={pfp.contractAddress} // Not applicable for non-nft PFPs
                            chainId={pfp.chainId} // Not applicable for non-nft PFPs
                            imageUrl={pfp.imageUrl}
                            accountProviderType={
                                pfp.accountProviderType ||
                                AccountProviderType.WALLET
                            }
                            setPfpSelected={setPfpSelected}
                            pfpSelected={pfpSelected}
                            favoritePfpsSelected={favoritePfpsSelected}
                            setFavoritePfpsSelected={setFavoritePfpsSelected}
                        />
                    ))}
                </SimpleGrid>
            </Box>
        );
    };

    return (
        <Tabs isLazy={false}>
            <TabPanels sx={styles.avatarTabPanelViewPortSx}>
                {getAvatarTab(activeTab) === AvatarTabsEnum.AVATAR && (
                    <TabPanel pt={0}>
                        <Box>{renderFavoritePfps()}</Box>
                        <Box>{renderAccountProviderPfps()}</Box>

                        <Box>
                            <Text
                                paddingTop={4}
                                sx={styles.avatarGridHeaderTextSx}
                            >
                                NFTs
                            </Text>
                        </Box>

                        {renderAvatarPFPSelectionGrid()}
                    </TabPanel>
                )}
                {getAvatarTab(activeTab) === AvatarTabsEnum.THEME && (
                    <TabPanel>
                        <ThemeColorSelectGrid
                            setColorSelected={setColorSelected}
                            colorSelected={colorSelected}
                        />
                    </TabPanel>
                )}
            </TabPanels>
        </Tabs>
    );
}

export default AvatarTabs;
