import { useCallback, useState } from "react";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { ColorObject, RecognitionComponent } from "@/types";
import { poppinsBold, poppinsBoldItalic } from "@/utils/themeUtil";
import { getUserProfilePicture } from "@/utils/userUtil";
import {
    getAllowedThemeColorObjectByColorName,
    alabasterColorObj,
} from "@/utils/wildpassUtil";
import {
    Box,
    Flex,
    Text,
    Image,
    TabPanel,
    TabPanels,
    Tabs,
    TabList,
    Tab,
    Wrap,
    useToast,
} from "@chakra-ui/react";
import * as styles from "./styles";
import Link from "next/link";
import StyledAvatarContainer from "./EditAvatarContainer";
import { IRecognitionProgram, PointItemCollection } from "@repo/interfaces";
import Flair from "./Flair";
import axios from "axios";
import Cookies from "js-cookie";
import { COOKIES_ACCESS_TOKEN_WILDCARD } from "@/utils/accountAPIUtil";
import { useBalancesStore } from "@/store/useWalletStore";
import { getWildpassTokensContractAddress } from "@/utils/environmentUtil";
import { InsightScoreRank } from "@/components/InsightScoreRank";

interface ProfileDetailsProps {
    formattedRecognitionProgram?: IRecognitionProgram;
    formattedRecognitionProgramTabs: IRecognitionProgram[];
}

const ProfileDetails = ({
    formattedRecognitionProgram,
    formattedRecognitionProgramTabs,
}: ProfileDetailsProps) => {
    const { connectedUserDBEmail, userDB } = useWildfileUserContext();
    const toast = useToast();

    const [recognitionProgram, setRecognitionProgram] = useState<any>(
        formattedRecognitionProgram
    );
    const [isLoading, setIsLoading] = useState<boolean>(false);

    /** BEGIN AVATAR-RELATED PROPS */
    const userDBAvatarThemeColor = userDB?.preferences?.avatarThemeColor;
    const themeColorObj = getAllowedThemeColorObjectByColorName(
        userDBAvatarThemeColor || alabasterColorObj
    );

    //@todo initial load use is undefined thus default alabaster color
    const [avatarThemeColor, setAvatarThemeColor] =
        useState<ColorObject>(themeColorObj);

    // get profile picture to user (either pfp or preferred provdier's image)
    const profPictureSrc = getUserProfilePicture(userDB);

    const wildcardTokenCount = (useBalancesStore(state => state.balances))[getWildpassTokensContractAddress()];

    const handleRecognitionProgramApiCall = useCallback(
        async (recognitionProgram: IRecognitionProgram) => {
            const { _id, name } = recognitionProgram;
            try {
                setIsLoading(true);
                const wildcardAccessToken = Cookies.get(
                    COOKIES_ACCESS_TOKEN_WILDCARD
                );
                const result = await axios.get(
                    `/api/accounts/profile/getrecognitionprogramprofile/${_id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${wildcardAccessToken}`,
                        },
                    }
                );

                if (!result.data) {
                    toast({
                        title: "Error",
                        description: `Unable to fetch recognition program: ${name}`,
                        status: "error",
                        duration: 5000,
                        isClosable: true,
                    });
                    return;
                }

                setRecognitionProgram(result.data);
                setIsLoading(false);
            } catch (e) {
                toast({
                    title: "Error",
                    description: `Failed to get recognition program: ${name}, id: ${_id?.toString()}`,
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
                setIsLoading(false);
                return;
            }
        },
        []
    );

    /**
     * Return text label jsx
     * @param smSize - whether this is a smaller font top label or not
     * @param text - text to display
     * @param color - color of text
     * @returns labe JSX
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
     * Render recognition rank name with its rank image
     * @param text - recognition rank name
     * @returns rank image with recognition rank name component
     */
    // const renderSubscript = (text: string) => {
    //     return (
    //         <Flex gap="5px">
    //             <Image
    //                 src={recognitionProgram.recognitionRankImageUrl}
    //                 height={"20px"}
    //                 width={"20px"}
    //                 loading="lazy"
    //             />
    //             <Text sx={{ fontSize: ["x-small", "smaller", "small"] }}>
    //                 {text}
    //             </Text>
    //         </Flex>
    //     );
    // };

    /**
     * Render member since component
     * @returns member since component
     */
    const renderMemberSince = () => {
        const memberSince = userDB?.createdAt
            ? new Date(userDB?.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            })
            : "N/A";
        return (
            <>
                <Text
                    sx={{
                        fontSize: ["x-small", "smaller", "small"],
                        mb: "5px",
                    }}
                >
                    Member Since
                </Text>
                <Flex
                    sx={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: "5px",
                    }}
                >
                    <Image
                        src="/images/thousands-token-2049M.svg"
                        h="30"
                        w="30"
                        alt="active badges"
                        loading="lazy"
                    />
                    <Text
                        sx={{
                            display: "inline-box",
                            fontSize: ["x-small", "small", "small"],
                            color: "gray.400",
                        }}
                    >
                        {memberSince}
                    </Text>
                </Flex>
            </>
        );
    };
    /** END */

    /**
     * Get recognition collection
     * @param recognitionItems - recognition item
     * @param collectionName - specific collection
     * @returns
     */
    const getRecognitionCollection = (
        recognitionItems: any[],
        recognitionComponentType: RecognitionComponent
    ) => {
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
    const getWildpassFullSpectrumSet = (pointItems: any[]) => {
        if (pointItems.length === 0) {
            return null;
        }

        const wildpasses = pointItems.find(
            (item) => item.name === "Full Spectrum"
        );
        if (!wildpasses) {
            return null;
        }

        return wildpasses;
    };

    /**
     * Render list of wildpasses component
     * @returns list of wildpasses jsx component
     */
    const renderWildpasses = () => {
        const wildpassCollection = getRecognitionCollection(
            recognitionProgram.recognitionItems,
            RecognitionComponent.WILDPASS
        );
        if (!wildpassCollection) {
            return null;
        }

        // @todo either display all the available recognition item or get selective recognition item to render
        // need clarification
        // currently get selective recognition item
        // console.log(JSON.stringify(wildpassCollection, null, 2));
        const wildpassFullSpectrum: PointItemCollection =
            getWildpassFullSpectrumSet(wildpassCollection.pointItemCollections);
        if (!wildpassFullSpectrum) {
            return null;
        }

        const {
            pointItems: wildpasses,
            showCompleteSetImageUrl,
            completeSetImageUrl,
            countOfPointItemsOwned,
        } = wildpassFullSpectrum;

        return (
            <Flex
                id="wildpasses"
                sx={{
                    flexDirection: ["column", "column", "column", "row"],
                    gap: 4,
                }}
            >
                <Flex
                    sx={{
                        flexDirection: "column",
                        gap: 2,
                    }}
                >
                    <Text
                        sx={{ display: "inline-flex", fontSize: ["x-small"] }}
                    >
                        Wildpasses{" "}
                        <Text as="span" sx={{ ml: 2 }}>
                            ({countOfPointItemsOwned}/{wildpasses.length})
                        </Text>
                    </Text>
                    <Wrap
                        spacing={"10px"}
                        sx={{
                            maxW: ["220px", "220px", "290px"],
                            minW: ["200px", "200px", "270px"],
                        }}
                    >
                        {wildpasses.map((wildpass: any) => {
                            if (wildpass.quantityOwned > 0) {
                                const wildpassLink = `https://magiceden.us/item-details/polygon/${wildpass.contractAddress}/${wildpass.tokenId}`;
                                return (
                                    <Link
                                        key={wildpass.name}
                                        href={wildpassLink}
                                        target="_blank"
                                        rel={"noopener noreferrer"}
                                    >
                                        <Image
                                            sx={{ cursor: "pointer" }}
                                            alt={wildpass.name}
                                            src={wildpass.itemImageUrl}
                                            // src={wildpass.itemImageUrl}
                                            h={"40px"}
                                            maxW={"none"}
                                            w={"60px"}
                                            loading="lazy"
                                        />
                                    </Link>
                                );
                            }
                        })}
                    </Wrap>
                </Flex>
                <Flex
                    sx={{
                        display: showCompleteSetImageUrl ? "flex" : "none",
                        flexDirection: "column",
                        gap: 2,
                    }}
                >
                    <Text
                        sx={{
                            fontSize: ["x-small"],
                            color: "gray",
                        }}
                    >
                        Full Spectrum
                    </Text>
                    <Image
                        alt={"full-spectrum"}
                        src={completeSetImageUrl}
                        // src={wildpass.itemImageUrl}
                        h={"40px"}
                        maxW={"none"}
                        w={"60px"}
                        loading="lazy"
                    />
                </Flex>
            </Flex>
        );
    };

    /**
     * Render carousel of flair collection componeent
     * @returns carousel of flair collection component
     */
    const renderFlair = () => {
        const flairCollections = getRecognitionCollection(
            recognitionProgram.recognitionItems,
            RecognitionComponent.FLAIR
        );
        if (!flairCollections) {
            return null;
        }

        const { pointItemCollections: flairs } = flairCollections;
        return (
            <Flex
                id="flairs"
                height="100%"
                wrap="wrap"
                gap={4}
                sx={{
                    height: "100%",
                    flexWrap: "wrap",
                    gap: 6,
                    alignItems: "center",
                }}
            >
                {flairs.map((flair: PointItemCollection) => {
                    return (
                        <Box
                            key={flair.name}
                            width={["auto", "auto", "auto", "340px"]}
                            position="relative"
                        >
                            <Flair flair={flair} />
                        </Box>
                    );
                })}
                {/* <LazyLoadCarousel flairCollections={flairCollections} /> */}
            </Flex>
        );
    };

    /**
     * Render recognition rank info component
     * @param rankImageUrl - recognition rank image url
     * @param rankName - recognition rank name
     * @param rankDescription - recognition rank description
     * @param key - recognition unique identifier
     * @returns recognition rank info jsx component
     */
    const renderRecognitionRankInfo = (
        rankImageUrl: string,
        rankName: string,
        rankDescription: string,
        key: string
    ) => {
        return (
            <Flex
                id={`rank-${key}-info`}
                key={key}
                sx={{
                    flexDirection: ["column", "column", "column", "row"],
                    columnGap: 2,
                }}
            >
                <Flex sx={{ alignItems: "center", columnGap: 2, flex: 1 }}>
                    <Image
                        src={rankImageUrl}
                        height={"100px"}
                        width={"100px"}
                        loading="lazy"
                    />
                    <Flex
                        sx={{
                            flexDirection: "column",
                            alignItems: "flex-start",
                        }}
                    >
                        <Text
                            sx={{
                                fontSize: "x-small",
                                lineHeight: 0.75,
                                color: "gray",
                            }}
                        >
                            Current Rank
                        </Text>
                        <Text>{rankName}</Text>
                    </Flex>
                </Flex>
                <Flex sx={{ flex: 1 }}>
                    <Text sx={{ fontSize: ["small"], color: "gray" }}>
                        <Text as="span" sx={{ color: "white" }}>
                            Category Description
                        </Text>{" "}
                        {rankDescription}
                    </Text>
                </Flex>
            </Flex>
        );
    };

    /**
     * Render recognition collection
     * @param renderCollection - callback func to render corresponding jsx collection
     * @returns recognition item collection
     */
    const renderRecognitionCollections = (
        renderCollection: () => React.ReactNode
    ) => {
        return (
            <Flex>
                <Flex sx={{ flexDirection: "column", gap: 4 }}>
                    {renderCollection()}
                </Flex>
            </Flex>
        );
    };

    /**
     * Render Wildpasses JSX component
     * @returns wildpasses jsx component
     */
    const renderWildpassesJsx = () => {
        return (
            <Flex
                id="wildpass-container"
                sx={{
                    flexDirection: "column",
                    gap: 4,
                }}
            >
                {/* {renderRecognitionRankInfo(
                    recognitionProgram.recognitionRankImageUrl,
                    recognitionProgram.recognitionRank,
                    recognitionProgram.recognitionRankDescription,
                    "wildpass"
                )}
                <Divider sx={{ w: "100%" }} /> */}
                {renderRecognitionCollections(renderWildpasses)}
            </Flex>
        );
    };

    const renderWildcardTokens = () => {
        if (userDB?.walletProvider?.address) return <Text fontSize="small">Wildcard Tokens: {wildcardTokenCount}</Text>;
    };

    /**
     * Render Collector JSX component
     * @returns collector jsx component
     */
    const renderCollectorJsx = () => {
        return (
            <Flex
                id="collector-container"
                sx={{
                    flexDirection: "column",
                    gap: 4,
                }}
            >
                {/* {renderRecognitionRankInfo(
                    recognitionProgram.recognitionRankImageUrl,
                    recognitionProgram.recognitionRank,
                    recognitionProgram.recognitionRankDescription,
                    "collector"
                )}
                <Divider sx={{ w: "100%" }} /> */}
                {renderRecognitionCollections(renderFlair)}
            </Flex>
        );
    };

    return (
        <Flex
            sx={{
                flexDirection: "column",
                width: ["100%", "100%", "100%", "100%", "960px"],
            }}
        >
            <Flex sx={{ mb: 2 }}>
                <Flex
                    id="avatar-details"
                    sx={{
                        flexDirection: ["column", "column", "row", "row"],
                        columnGap: 2,
                        w: "100%",
                        flexWrap: [
                            "nowrap",
                            "nowrap",
                            "nowrap",
                            "nowrap",
                            "nowrap",
                        ],
                    }}
                >
                    <Flex
                        sx={{
                            w: "100%",
                            justifyContent: "center",
                            alignSelf: "flex-start",
                            p: ["70px 0 35px", "70px 0 35px", "70px"],
                        }}
                    >
                        <StyledAvatarContainer
                            profPictureSrc={profPictureSrc}
                            avatarThemeColor={avatarThemeColor}
                            connectedUserDBEmail={connectedUserDBEmail}
                        />
                    </Flex>
                    <Flex
                        sx={{
                            flexDirection: "column",
                            w: "100%",
                            alignItems: ["center", "center", "flex-start"],
                        }}
                    >
                        <Flex
                            sx={{
                                flexDirection: ["column"],
                                w: ["auto", "auto", "350px"],
                            }}
                        >
                            {renderLabel(
                                false,
                                userDB?.preferences?.displayName ||
                                "No Display Name Set"
                            )}
                            {/* <Flex
                                sx={{
                                    gap: "10px",
                                    flexDirection: "row",
                                }}
                            >
                                {renderSubscript(
                                    recognitionProgram.recognitionRank
                                )}
                                {renderSubscript("Unranked Ambassador")}
                            </Flex> */}
                            <Box sx={{ my: [2, 2, 2, 3] }}>
                                {renderMemberSince()}
                            </Box>
                            <Flex
                                sx={{
                                    flexDirection: "column",
                                    gap: 2,
                                    justifyContent: "center",
                                }}
                            >
                                {renderWildcardTokens()}
                                {/*<InsightScoreRank userId={userDB?._id?.toString()} />*/}
                                {/*<UserSocialInfo />
                                <LatestActivity />*/}
                            </Flex>
                        </Flex>
                    </Flex>
                </Flex>
            </Flex>
            <Flex
                sx={{
                    width: "100%",
                }}
            >
                <Tabs
                    sx={{ width: "100%" }}
                    size="lg"
                    isLazy={true}
                    onChange={(index) => {
                        handleRecognitionProgramApiCall(
                            formattedRecognitionProgramTabs[index]
                        );
                    }}
                >
                    <Box>
                        <TabList>
                            {formattedRecognitionProgramTabs?.map(
                                (programTab: any) => {
                                    return (
                                        <Tab key={programTab._id.toString()}>
                                            {programTab.name}
                                        </Tab>
                                    );
                                }
                            )}
                        </TabList>
                    </Box>
                    <Flex sx={{ w: "100%" }}>
                        <TabPanels>
                            <TabPanel>{renderWildpassesJsx()}</TabPanel>
                            <TabPanel>{renderCollectorJsx()}</TabPanel>
                        </TabPanels>
                    </Flex>
                </Tabs>
            </Flex>
        </Flex>
    );
};

export default ProfileDetails;
