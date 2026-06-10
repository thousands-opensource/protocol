import { LimitedTimeDiscount, RecognitionComponent } from "@/types";
import { COOKIES_ACCESS_TOKEN_WILDCARD } from "@/utils/accountAPIUtil";
import { Flex, Spinner } from "@chakra-ui/react";
import {
    PointItemCategory,
    PointItemCollection,
    RecognitionProgram,
} from "@repo/interfaces";
import axios from "axios";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import Cookies from "js-cookie";
import {
    THEME_COLOR_YELLOW_DARK,
    WILDCARD_SWAG_CONTRACT_ADDRESS,
} from "@/constants/constants";
import { poppinsMedium } from "@/utils/themeUtil";
import YourStatus from "../YourStatus";
import DiscountPanel from "../DiscountPanel";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";

interface DiscountOverviewProps {
    discountCategory: LimitedTimeDiscount[];
    setDiscountCategory: Dispatch<SetStateAction<LimitedTimeDiscount[]>>;
    walletCount: number;
    onLoadingChange?: (isLoading: boolean) => void;
}

export const DISCOUNTS_CONFIG = [
    // {
    //      discount: LimitedTimeDiscount.EARLY_BIRD,
    //      name: "Early Bird",
    //      bonus: [5, 5, 5, 5, 5, 5],
    //      link: "",
    // },
    // {
    //      discount: LimitedTimeDiscount.PAUL_SPOKE_TOO_SOON,
    //      name: "Paul spoke too soon",
    //      bonus: [5, 5, 5, 5, 5, 5],
    //      link: "",
    // },
    // {
    //      discount: LimitedTimeDiscount.BETTNER_BONUS,
    //      name: "The Bettner Bonus",
    //      bonus: [20, 20, 20, 20, 20, 20],
    //      link: "",
    // },    
    {
        discount: LimitedTimeDiscount.WILDPASS,
        name: "Wildpass",
        bonus: [10, 10, 10, 10, 10, 10],
        link: "https://magiceden.us/collections/ethereum/0xd8cb3f39875def5853b155c0adf2530644397428",
    },
    {
        discount: LimitedTimeDiscount.FULL_SPECTRUM,
        name: "Full Spectrum",
        bonus: [10, 10, 10, 10, 10, 10],
        link: "https://magiceden.us/collections/ethereum/0xd8cb3f39875def5853b155c0adf2530644397428",
    },
    {
        discount: LimitedTimeDiscount.FLAIR,
        name: "Completed Flair Set",
        bonus: [5, 5, 5, 5, 5, 5],
        link: "https://magiceden.us/collections/polygon/0x305a9d605455844ad3779204fddc0b41d6dc1788",
    },
    // {
    //     discount: LimitedTimeDiscount.KOIN_GAMES,
    //     name: "Koin Games NFT",
    //     bonus: [10, 10, 10, 10, 10, 10],
    //     link: "https://magiceden.us/collections/ethereum/0x548c407d35cdd3c812458d9ef6d135963f9f7ece",
    // },
    // {
    //     discount: LimitedTimeDiscount.WOLVES_DAO,
    //     name: "Wolves DAO",
    //     bonus: [20, 20, 20, 20, 20, 20],
    //     link: "https://polygonscan.com/token/0x0433882C60aDa1077A9F652ca2d1D36422c62C6C",
    // },
    // {
    //     discount: LimitedTimeDiscount.PIRATE_NATION,
    //     name: "Staked PIRATE or Founder Pirate NFT",
    //     bonus: [10, 10, 10, 10, 10, 10],
    //     link: "",
    //     //link: "https://etherscan.io/address/0x6759aCD57cB5EA451a3eDF397734eDDDFc123049",
    // },
    // {
    //     discount: LimitedTimeDiscount.AGENT_YP,
    //     name: "Agent YP Bonus (12,000 Tokens)",
    //     bonus: [10, 10, 10, 10, 10, 10],
    //     link: "",
    // },
    // {
    //     discount: LimitedTimeDiscount.WARDENS_AND_CATALYST,
    //     name: "The Wardens",
    //     bonus: [10, 10, 10, 10, 10, 10],
    //     link: "",
    // },
];

const DiscountOverview = ({
    discountCategory,
    setDiscountCategory,
    walletCount,
    onLoadingChange,
}: DiscountOverviewProps) => {
    const { address } = useAccount();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { userDB } = useWildfileUserContext();

    useEffect(() => {
        onLoadingChange?.(isLoading);
    }, [isLoading, onLoadingChange]);

    /**
     * Get recognition collection
     * @param recognitionItems - recognition item
     * @param collectionName - specific collection
     * @returns
     */
    const getRecognitionCollection = (
        recognitionItems: PointItemCategory[],
        recognitionComponentType: RecognitionComponent
    ): PointItemCategory | null => {
        if (recognitionItems.length === 0) {
            return null;
        }

        const recognitionCollection = recognitionItems.find(
            (item) => item.recognitionComponent === recognitionComponentType
        );
        if (!recognitionCollection) {
            return null;
        }

        return recognitionCollection;
    };

    /**
     * Get wildpass collection set object
     * @param pointItems - recognition point item
     * @returns wildpasses collection
     */
    const getWildpassFullSpectrumSet = (
        pointItems: PointItemCollection[]
    ): PointItemCollection | null => {
        if (pointItems.length === 0) {
            return null;
        }

        const wildpasses = pointItems.find(
            (item) => item.name.toLowerCase() === "Full Spectrum".toLowerCase()
        );
        if (!wildpasses) {
            return null;
        }

        return wildpasses;
    };

    const getWildpassFullSpectrumItemCollection = async (
        recognitionProgramId: string
    ): Promise<PointItemCollection | null> => {
        const recognitionProgram: RecognitionProgram | null =
            await fetchRecognitionProgram(recognitionProgramId);
        if (!recognitionProgram) {
            return null;
        }

        const wildpassCollection: PointItemCategory | null =
            getRecognitionCollection(
                recognitionProgram.recognitionItems,
                RecognitionComponent.WILDPASS
            );
        if (!wildpassCollection) {
            return null;
        }

        const wildpassFullSpectrum: PointItemCollection | null =
            getWildpassFullSpectrumSet(wildpassCollection.pointItemCollections);

        return wildpassFullSpectrum;
    };

    const getFlairItemCollections = async (
        recognitionProgramId: string
    ): Promise<PointItemCollection[] | null> => {
        const recognitionProgram: RecognitionProgram | null =
            await fetchRecognitionProgram(recognitionProgramId);
        if (!recognitionProgram) {
            return null;
        }

        const flairCollections: PointItemCategory | null =
            getRecognitionCollection(
                recognitionProgram.recognitionItems,
                RecognitionComponent.FLAIR
            );

        if (!flairCollections) {
            return null;
        }

        return flairCollections.pointItemCollections;
    };

    const hasAtLeastOneCompletedFlairCollection = (
        polyFlairCollections: PointItemCollection[]
    ): boolean => {
        if (polyFlairCollections.length === 0) {
            return false;
        }

        for (const flairCollection of polyFlairCollections) {
            let count = 0;
            for (const flair of flairCollection.pointItems) {
                if (
                    flair.contractAddress.toLowerCase() ===
                        WILDCARD_SWAG_CONTRACT_ADDRESS.toLowerCase() &&
                    flair.quantityOwned > 0
                ) {
                    count++;
                }
            }

            if (count === flairCollection.pointItems.length) {
                return true;
            }
        }

        return false;
    };

    const fetchRecognitionProgram = async (
        wildpassRecognitionProgramId: string
    ): Promise<RecognitionProgram | null> => {
        try {
            const wildcardAccessToken = Cookies.get(
                COOKIES_ACCESS_TOKEN_WILDCARD
            );
            const wildpassRecognitionProgramResult = await axios
                .get(
                    `/api/accounts/profile/getrecognitionprogramprofile/${wildpassRecognitionProgramId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${wildcardAccessToken}`,
                        },
                    }
                )
                .catch((e: any) => {
                    console.error(
                        `Failed to fetch recognition program: ${wildpassRecognitionProgramId}`,
                        e
                    );
                    return { data: { recognitionItems: [] } };
                });

            const wildpassRecognitionProgram: RecognitionProgram =
                wildpassRecognitionProgramResult.data;
            return wildpassRecognitionProgram;
        } catch (e: any) {
            console.error(
                `Error fetching recognition program: ${wildpassRecognitionProgramId}`,
                e
            );
            return null;
        }
    };

    useEffect(() => {
        async function processRecognitionProgram() {
            const polyWildpassRecognitionProgramId = "67223e04a6574fd99d12ffc2";
            const polyFlairRecognitionProgramId = "67223e51a6574fd99d12ffc3";
            const ethWildpassRecognitionProgramId = "67ae766de400b5645bded5b1";
            setIsLoading(true);
            // By default - No default bonus right now
            let discounts = new Set<LimitedTimeDiscount>([]);

            // Process ETH Wildpass first
            try {
                const ethWildpassFullSpectrum: PointItemCollection | null =
                    await getWildpassFullSpectrumItemCollection(
                        ethWildpassRecognitionProgramId
                    );

                if (ethWildpassFullSpectrum) {
                    const { showCompleteSetImageUrl, countOfPointItemsOwned } =
                        ethWildpassFullSpectrum;

                    const numOfEthWildpassOwned = countOfPointItemsOwned ?? 0;
                    // Has FULL_SPECTRUM wildpasses in ETH
                    if (showCompleteSetImageUrl) {
                        discounts.add(LimitedTimeDiscount.FULL_SPECTRUM);
                        discounts.add(LimitedTimeDiscount.WILDPASS);
                    }

                    // has AT LEAST 1 wildpasses in ETH
                    if (numOfEthWildpassOwned > 0) {
                        discounts.add(LimitedTimeDiscount.WILDPASS);
                    }
                }
            } catch (e: any) {
                console.error(
                    `Error processing eth wildpass recognition program: ${ethWildpassRecognitionProgramId}`,
                    e
                );
            }

            /*
            //Check for token on Base
            try {
                if (address) {
                    const wildcardAccessToken = Cookies.get(
                        COOKIES_ACCESS_TOKEN_WILDCARD
                    );

                    const walletAddresses = [
                        address,
                        ...(userDB?.walletProvider?.additionalWallets || []),
                    ];

                    const { data } = await axios.get(
                        `/api/fetchHasBaseTokens`,
                        {
                            headers: {
                                Authorization: `Bearer ${wildcardAccessToken}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );

                    if (!!data.data?.isBaseTokenHolder) {
                        discounts.add(LimitedTimeDiscount.AGENT_YP);
                    }
                }
            } catch (e) {
                console.error(
                    `Error processing base token ownership for address ${address}`,
                    e
                );
            }
            */

            /*
            // Process Pirate Nation next
            try {
                if (address) {
                    const wildcardAccessToken = Cookies.get(
                        COOKIES_ACCESS_TOKEN_WILDCARD
                    );

                    const walletAddresses = [
                        address,
                        ...(userDB?.walletProvider?.additionalWallets || []),
                    ];

                    const { data } = await axios.get(
                        `/api/fetchIsStakedPirateHolder`,
                        {
                            headers: {
                                Authorization: `Bearer ${wildcardAccessToken}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );

                    if (!!data.data?.isStakedPirateHolder) {
                        discounts.add(LimitedTimeDiscount.PIRATE_NATION);
                    }
                }
            } catch (e) {
                console.error(
                    `Error processing staked pirate nation ownership for address ${address}`,
                    e
                );
            }

            // Process PIRATE NATION NFT check
            try {
                if (address) {
                    const wildcardAccessToken = Cookies.get(
                        COOKIES_ACCESS_TOKEN_WILDCARD
                    );

                    const { data } = await axios.get(
                        `/api/fetchHasPirateNationNft`,
                        {
                            headers: {
                                Authorization: `Bearer ${wildcardAccessToken}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );

                    if (!!data.data?.isPirateNationNftHolder) {
                        discounts.add(LimitedTimeDiscount.PIRATE_NATION);
                    }
                }
            } catch (e) {
                console.error(
                    `Error processing wolves dao ownership for address ${address}`,
                    e
                );
            }
            */

            // Process Koin Games NFT check
            /*
            try {
                if (address) {
                    const wildcardAccessToken = Cookies.get(
                        COOKIES_ACCESS_TOKEN_WILDCARD
                    );

                    const { data } = await axios.get(
                        `/api/fetchHasEthNft`,
                        {
                            headers: {
                                Authorization: `Bearer ${wildcardAccessToken}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );

                    if (!!data.data?.isEthNftHolder) {
                        discounts.add(LimitedTimeDiscount.KOIN_GAMES);
                    }
                }
            } catch (e) {
                console.error(
                    `Error processing Eth Nft ownership for address ${address}`,
                    e
                );
            }
            */

            /*
            // Process The Wardens SBT NFT check
            try {
                if (address) {
                    const wildcardAccessToken = Cookies.get(
                        COOKIES_ACCESS_TOKEN_WILDCARD
                    );

                    const { data } = await axios.get(
                        `/api/fetchHasBaseNft`,
                        {
                            headers: {
                                Authorization: `Bearer ${wildcardAccessToken}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );

                    if (!!data.data?.isBaseNftHolder) {
                        discounts.add(LimitedTimeDiscount.WARDENS_AND_CATALYST);
                    }
                }
            } catch (e) {
                console.error(
                    `Error processing Base Nft ownership for address ${address}`,
                    e
                );
            }

            // Process Catalyst Magazine NFT check
            try {
                if (address) {
                    const wildcardAccessToken = Cookies.get(
                        COOKIES_ACCESS_TOKEN_WILDCARD
                    );

                    const { data } = await axios.get(
                        `/api/fetchHasAvaxNft`,
                        {
                            headers: {
                                Authorization: `Bearer ${wildcardAccessToken}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );

                    if (!!data.data?.isAvaxNftHolder) {
                        discounts.add(LimitedTimeDiscount.WARDENS_AND_CATALYST);
                    }
                }
            } catch (e) {
                console.error(
                    `Error processing Avax Nft ownership for address ${address}`,
                    e
                );
            }
            */

            // Process POLYGON flair next
            try {
                const polyFlairCollections: PointItemCollection[] | null =
                    await getFlairItemCollections(
                        polyFlairRecognitionProgramId
                    );

                if (polyFlairCollections) {
                    const hasCompletedFlairCollectionSet =
                        hasAtLeastOneCompletedFlairCollection(
                            polyFlairCollections
                        );

                    // has AT LEAST 1 completed flair collection under Wildcard Flair Contract Addr
                    if (hasCompletedFlairCollectionSet) {
                        discounts.add(LimitedTimeDiscount.FLAIR);
                    }
                }
            } catch (e: any) {
                console.error(
                    `Error processing polygon flair recognition program: ${polyFlairRecognitionProgramId}`,
                    e
                );
            } finally {
                setDiscountCategory([...Array.from(discounts)]);
                setIsLoading(false);
            }
        }

        processRecognitionProgram();
    }, [address, walletCount]);

    if (isLoading) {
        return <Spinner size="xl" color={THEME_COLOR_YELLOW_DARK} />;
    }

    return (
        <Flex
            sx={{
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 2,
                height: "100%",
                minW: "100%",
            }}
            className={poppinsMedium.className}
        >
            <YourStatus discountCategory={discountCategory} />
            {/*<Text>Testing - unique eth wildpass - {ethWildpasses}</Text>*/}
            <DiscountPanel discountCategory={discountCategory} />
        </Flex>
    );
};
export default DiscountOverview;
