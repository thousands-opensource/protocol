import {
    Box,
    Flex,
    IconButton,
    Modal,
    ModalHeader,
    ModalBody,
    ModalContent,
    ModalOverlay,
    Text,
    useDisclosure,
    Button,
    ModalFooter,
    useToast,
    Divider,
    Link,
} from "@chakra-ui/react";
import { MdEdit } from "react-icons/md";
import { Network, OwnedNft } from "alchemy-sdk";
import axios from "axios";
import { Dispatch, SetStateAction, useState } from "react";
import * as styles from "./styles";
import { ColorObject } from "@/types";
import { getAllowedThemeColorsByEnum } from "@/utils/wildpassUtil";
import { CloseIcon } from "@chakra-ui/icons";
import { getUserPfp } from "@/utils/userUtil";
import { useGlobalContext } from "@/contexts/globalContext";
import AvatarTabs, { AvatarTabsEnum, AvatarTabsProps } from "./AvatarTabs";
import ModalPopover from "@/components/ModalPopover";
import AvatarImage from "../AvatarImage";
import { getWildpassSuggestionUrl } from "@/utils/environmentUtil";
import { emptyPfp, toastDefaultOptions } from "@/constants/constants";
import CustomizeSVG from "./CustomizeSVG";
import { PfpMetadata, WildcardApiResponse } from "@repo/interfaces";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { DICEBEAR_URL } from "@/constants";

/**
 * Avatar Collection Interface
 */
interface AvatarCollectionProps {
    setAvatarThemeColor: (color: ColorObject) => void;
    avatarThemeColor: ColorObject;
    handleFetchPfps: () => Promise<void>;
    fetchPfps: (network: Network) => Promise<WildcardApiResponse>;
    accountProviderPfps: PfpMetadata[];
    nftPfps: OwnedNft[];
    setNftPfps: Dispatch<SetStateAction<OwnedNft[]>>;
    totalPfpCount: number;
    nextPageKeys: Record<string, string>;
    setNextPageKeys: Dispatch<SetStateAction<Record<string, string>>>;
    isPfpsLoading: boolean;
    pfpSelected: PfpMetadata;
    setPfpSelected: Dispatch<SetStateAction<PfpMetadata>>;
    showEditIcon: boolean;
}

interface GeneratedAvatarProps {
    seed: string;
    onSaveAsProfile: (imageUrl: string) => void;
}

const GeneratedAvatarSection = ({ seed, onSaveAsProfile }: GeneratedAvatarProps) => {
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const toast = useToast();

    const generateNewAvatar = async () => {
        try {
            const imageUrl = `${DICEBEAR_URL}&seed=${encodeURIComponent(seed + (new Date().getTime().toString()))}`;
            setGeneratedImage(imageUrl);
        } catch (error) {
            console.error("Error generating new avatar:", error);
            toast({
                ...toastDefaultOptions,
                description: "Failed to generate a new avatar.",
                status: "error",
            });
        }
    };

    return (
        <Flex direction="column" gap={4} p={4} borderTop="1px solid" borderColor="gray.200">
            <Text fontSize="lg" fontWeight="bold">Generate New Avatar</Text>
            {generatedImage && (
                <Flex direction="column" align="center" gap={4}>
                    <Box width="150px" height="150px">
                        <img src={generatedImage} alt="Generated avatar" style={{ width: '100%', height: '100%' }} />
                    </Box>
                    <Button
                        onClick={() => onSaveAsProfile(generatedImage)}
                        sx={styles.modalSaveButtonStyle}
                    >
                        Use as Profile Picture
                    </Button>
                </Flex>
            )}
            <Button
                onClick={generateNewAvatar}
                sx={styles.modalSaveButtonStyle}
            >
                Generate New Avatar
            </Button>
        </Flex>
    );
};

const AvatarCollection = ({
    setAvatarThemeColor,
    avatarThemeColor,
    handleFetchPfps,
    fetchPfps,
    accountProviderPfps,
    nftPfps,
    setNftPfps,
    totalPfpCount,
    nextPageKeys,
    setNextPageKeys,
    isPfpsLoading,
    pfpSelected,
    setPfpSelected,
    showEditIcon,
}: AvatarCollectionProps) => {
    const { setUserDB, userDB } = useWildfileUserContext();
    const { setLoadingSpinner } = useGlobalContext();

    const favoritePfps: PfpMetadata[] =
        userDB?.walletProvider?.favoritePfps || [];
    const currentPfp: PfpMetadata = userDB ? getUserPfp(userDB) : emptyPfp;

    // store local state of selected options before commit/ save to mongo
    const [colorSelected, setColorSelected] =
        useState<ColorObject>(avatarThemeColor);

    const [favoritePfpsSelected, setFavoritePfpsSelected] =
        useState<PfpMetadata[]>(favoritePfps);

    const [activeAvatarTab, setActiveAvatarTab] = useState<AvatarTabsEnum>(
        AvatarTabsEnum.AVATAR
    );

    const handleAvatarTabChange = (tab: AvatarTabsEnum) => {
        setActiveAvatarTab(tab);
    };

    const toast = useToast();

    const { isOpen, onOpen, onClose } = useDisclosure();

    /**
     * Open modal and fetch all pfps
     */
    function editAvatarClick() {
        onOpen();
        //Only fetch pfps once per load of the entire page
        if (accountProviderPfps.length > 0 || nftPfps.length > 0) {
            return;
        }

        handleFetchPfps();
    }

    /**
     * Close Edit Avatar modal and reset pfp, favoritePfps, and theme color
     */
    const cancelEditAvatarChanges = () => {
        setPfpSelected(currentPfp);
        setFavoritePfpsSelected(favoritePfps);
        setColorSelected(avatarThemeColor);
        onClose();
    };

    /**
     * Add or remove pfp to/from favorite list local state and make a api call to update it
     */
    const updateFavoritePfps = async () => {
        const newFavoritePfps: PfpMetadata[] = favoritePfpsSelected;
        const reqBody = {
            pfps: newFavoritePfps,
        };

        const res = await axios.post("/api/updateFavoritePfps/", reqBody);
        const favoritePfpsResp: WildcardApiResponse = res.data;
        if (!favoritePfpsResp.success) {
            toast({
                ...toastDefaultOptions,
                description: `Unable to update list of favorite profile pictures. ${favoritePfpsResp.err}`,
                status: "error",
            });
            setFavoritePfpsSelected(favoritePfps);
            return;
        }

        toast({
            ...toastDefaultOptions,
            description: `Successfully update list of favorite profile pictures. `,
            status: "success",
            duration: 3000,
        });
        setUserDB(favoritePfpsResp.data);
    };

    /**
     * Compare two pfp objects and determine their order by contractAddress followed by tokenId
     * @param pfp Pfp metadata object
     * @param otherPfp pfp metadata object
     * @returns number whose sign indicates the relative order
     */
    const favoritePfpsComparator = (
        pfp: PfpMetadata,
        otherPfp: PfpMetadata
    ) => {
        if (pfp.contractAddress === otherPfp.contractAddress) {
            // Tokenid is only important if same contract address match
            return otherPfp.tokenId > pfp.tokenId ? -1 : 1;
        }
        return pfp.contractAddress > otherPfp.contractAddress ? 1 : -1;
    };

    /**
     * Handles update favorite pfps
     */
    const handleUpdateFavoritePfps = async () => {
        const sortedFavoritePfps = [...favoritePfps].sort(
            favoritePfpsComparator
        );
        const sortedFavoritePfpsSelected = [...favoritePfpsSelected].sort(
            favoritePfpsComparator
        );

        if (sortedFavoritePfps.length === sortedFavoritePfpsSelected.length) {
            let updateFlag = false;
            // Check if there is a new pfp added in this sorted array of favorite pfps
            for (
                let index = 0;
                index < sortedFavoritePfpsSelected.length;
                index++
            ) {
                if (
                    sortedFavoritePfpsSelected[index].contractAddress !==
                    sortedFavoritePfps[index].contractAddress &&
                    sortedFavoritePfpsSelected[index].tokenId !==
                    sortedFavoritePfps[index].tokenId
                ) {
                    updateFlag = true;
                    break;
                }
            }

            if (!updateFlag) {
                // Reset back to pageOwnerUser favorite pfps
                setFavoritePfpsSelected(favoritePfps);
                return;
            }
        }

        await updateFavoritePfps();
        return;
    };

    /**
     * Handles the update of avatar theme color based on the user's selected preference
     * @param colorSelected - user's selected color
     */
    const handleUpdateAvatarThemeColor = async (colorSelected: ColorObject) => {
        if (colorSelected.colorName === avatarThemeColor.colorName) {
            return;
        }

        const reqBody = {
            avatarThemeColor: getAllowedThemeColorsByEnum(colorSelected),
        };

        // make a call to mongo storing avatar theme color
        const res = await axios.post("/api/updateAvatarThemeColor/", reqBody);
        const avatarThemeColorResp: WildcardApiResponse = res.data;

        if (!avatarThemeColorResp.success) {
            toast({
                ...toastDefaultOptions,
                description: `Unable to select color: ${name}`,
                status: "error",
                duration: 3000,
            });
            return;
        }

        toast({
            ...toastDefaultOptions,
            description: `Theme color updated to ${colorSelected.colorName}`,
            status: "success",
            duration: 3000,
        });

        // update user in local state
        setUserDB(avatarThemeColorResp.data);

        // update theme color upon success
        setAvatarThemeColor(colorSelected);
    };

    /**
     * Add avatar as pfp this should save to local state then make a call to mongo
     */
    const updatePfp = async () => {
        const reqBody = {
            pfp: pfpSelected,
        };
        const res = await axios.post("/api/updatePfp/", reqBody);

        const pfpResp: WildcardApiResponse = res.data;
        if (!pfpResp.success) {
            toast({
                ...toastDefaultOptions,
                description: pfpResp.err,
                status: "error",
                duration: 30 * 1000,
            });
            return;
        }

        toast({
            ...toastDefaultOptions,
            description: `Successfully set ${pfpSelected.name} your profile picture!`,
            status: "success",
            duration: 5000,
        });

        setUserDB(pfpResp.data.updatedUser);
    };

    const handleUpdatePfp = async () => {
        if (
            currentPfp.tokenId === pfpSelected.tokenId &&
            currentPfp.contractAddress === pfpSelected.contractAddress &&
            currentPfp.imageUrl === pfpSelected.imageUrl
        ) {
            return;
        }

        await updatePfp();
        return;
    };

    /**
     * Save avatar preferences - Saves selected pfp and theme color to db
     * @dev - commit stored local state changes to mongo
     * @returns - success or failure
     */
    const saveAvatarPreferences = async () => {
        try {
            setLoadingSpinner(true);
            await handleUpdatePfp();
            await handleUpdateAvatarThemeColor(colorSelected);
            await handleUpdateFavoritePfps();
            setLoadingSpinner(false);
            onClose();
        } catch (err) {
            console.error(err);
            onClose();
        }
    };

    const handleSaveGeneratedAvatar = async (imageUrl: string) => {
        try {
            setPfpSelected({
                ...emptyPfp,
                imageUrl,
                name: 'Generated Avatar'
            });

            toast({
                ...toastDefaultOptions,
                description: "New avatar generated. Click Save to update your profile.",
                status: "success",
            });
        } catch (error) {
            console.error("Error saving generated avatar:", error);
            toast({
                ...toastDefaultOptions,
                description: "Failed to use generated avatar.",
                status: "error",
            });
        }
    };

    /**
     * Renders edit avatar/ customize when you are logged in and isOwner otherwise hide it
     * @dev - returns empty JSX - keeps the same css flex layout when "customize" is hidden (to ensure consistent UI spacing)
     * @returns edit avatar/ customize component
     */
    const renderEditAvatar = () => {
        if (showEditIcon) {
            return (
                <IconButton
                    isRound={true}
                    colorScheme="white"
                    backgroundColor={"white"}
                    size={"xs"}
                    _hover={{
                        bg: "whiteAlpha.800",
                    }}
                    id={"ga-profile-element-edit-avatar"}
                    onClick={() => {
                        editAvatarClick();
                    }}
                    aria-label="edit"
                    icon={<MdEdit />}
                />
            );
        } else {
            return null;            
        }
    };

    const avatarTabsProps: AvatarTabsProps = {
        activeTab: activeAvatarTab,
        setColorSelected,
        colorSelected,
        nextPageKeys,
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
    };

    /**
     * Render Custom Avatar button tabs (e.g.Avatar and Theme)
     * @returns Avatar button tabs
     */
    const renderAvatarButtonTabs = () => {
        return (
            <Flex sx={styles.avatarTabHeaderFlexSx}>
                <Button
                    id={"ga-edit-avatar-tab-button-avatar-pfp"}
                    variant={"ghost"}
                    sx={styles.modalTabButtonSx(
                        activeAvatarTab === AvatarTabsEnum.AVATAR
                    )}
                    onClick={() => handleAvatarTabChange(AvatarTabsEnum.AVATAR)}
                >
                    Avatar
                </Button>
                <Button
                    id={"ga-edit-avatar-tab-button-theme-selection"}
                    variant={"ghost"}
                    sx={styles.modalTabButtonSx(
                        activeAvatarTab === AvatarTabsEnum.THEME
                    )}
                    onClick={() => handleAvatarTabChange(AvatarTabsEnum.THEME)}
                >
                    Theme
                </Button>
            </Flex>
        );
    };

    /**
     * Renders Edit Avatar modal footer (Save and Cancel button)
     * @returns Edit Avatar modal footer
     */
    const renderEditAvatarModalFooter = () => {
        return (
            <Flex sx={styles.modalFooterFlexSx}>
                <Button
                    onClick={() => cancelEditAvatarChanges()}
                    sx={styles.modalSaveButtonStyle}
                >
                    Cancel
                </Button>

                <Button
                    id={"ga-edit-avatar-button-save"}
                    onClick={() => saveAvatarPreferences()}
                    sx={styles.modalSaveButtonStyle}
                >
                    Save
                </Button>
            </Flex>
        );
    };

    const renderEditAvatarModalHeader = () => {
        return (
            <Flex>
                <Flex sx={styles.selectAvatarFlex}>
                    <CustomizeSVG avatarThemeColor={avatarThemeColor} />
                </Flex>
                <Box sx={styles.iconButtonWrapper}>
                    <IconButton
                        aria-label="Go back"
                        onClick={cancelEditAvatarChanges}
                        variant="ghost"
                        sx={styles.modalBackButtonStyle}
                        icon={<CloseIcon sx={styles.closeButtonIcon} />}
                    />
                </Box>
            </Flex>
        );
    };

    /**
     * Renders popover component directing user to suggest projects to be added to the next update
     * @returns popover component
     */
    const renderModalPopover = () => {
        return (
            <ModalPopover
                popoverHeader={
                    <Text sx={styles.popoverTextSx}>
                        {`Don't See the Avatar You Want to
                                            Use?`}
                    </Text>
                }
                popoverBody={
                    <>
                        Click{" "}
                        <Link
                            sx={styles.popoverLinkSx}
                            target="_blank"
                            href={getWildpassSuggestionUrl()}
                            rel="noopener noreferrer"
                        >
                            here
                        </Link>{" "}
                        to suggest projects to be added to the next update
                    </>
                }
            />
        );
    };

    /**
     * Render the number of pfps owned by the user
     * @dev - if pfps are still loading, display loading text
     * @returns number of pfps owned by the user
     */
    const getNoOfPfpsOwned = () => {
        if (isPfpsLoading) {
            return <>{`Loading...`}</>;
        }
        if (!accountProviderPfps || !nftPfps) {
            return <>{`(0)`}</>;
        }
        return <>{`(${accountProviderPfps.length + nftPfps.length})`}</>;
    };

    /**
     * Displays number of avatars text and info popup
     * @param smallScreensOnly - whether to show on smaller screen sizes or not
     * @returns JSX
     */
    function renderAvatarNumberAndPopup(smallScreensOnly: boolean) {
        if (activeAvatarTab !== AvatarTabsEnum.AVATAR) {
            return null;
        }
        const display = smallScreensOnly
            ? ["flex", "flex", "flex", "none"]
            : ["none", "none", "none", "flex"];
        return (
            <Flex
                sx={styles.avatarContainerTopFlexSx}
                display={display}
                id="avatarContainerTopFlexSx"
            >
                <Flex sx={styles.avatarTextTitleFlexSx}>
                    <Text sx={styles.avatarTextTitleSx}>Avatars</Text>
                    <Box sx={styles.avatarTextWildpassCountSx}>
                        {getNoOfPfpsOwned()}
                    </Box>
                </Flex>
                {renderModalPopover()}
            </Flex>
        );
    }

    /**
     * Render Edit Avatar modal body (Avatar Image Preview)
     * @returns Edit Avatar / Customize modal body
     */
    const renderAvatarChosen = () => {
        return (
            <Flex sx={styles.avatarContainerFlexSx} id="avatarContainerFlexSx">
                <AvatarImage
                    avatarThemeColor={avatarThemeColor}
                    previewMode={true}
                    pfpSelected={pfpSelected}
                    colorSelected={colorSelected}
                />
            </Flex>
        );
    };

    /**
     * Right column/ bottom row (for mobile)-- PFPs Owned and Theme
     * @returns JSX
     */
    const renderPfpsOwnedAndThemes = () => {
        return (
            <Flex sx={styles.modalBodyFlexSx} id="modalBodyFlexSx">
                {renderAvatarButtonTabs()}
                <Flex sx={styles.modalBodyContentsFlexSx}>
                    {renderAvatarNumberAndPopup(false)}
                    <AvatarTabs {...avatarTabsProps} />
                </Flex>
            </Flex>
        );
    };

    return (
        <>
            <Box>{renderEditAvatar()}</Box>
            <Modal
                isCentered
                isOpen={isOpen}
                onClose={onClose}
                motionPreset="slideInBottom"
                size={"3xl"}
                scrollBehavior="inside"
                closeOnOverlayClick={true}
            >
                <ModalOverlay sx={styles.modalOverlaySx} id="modalOverlay" />
                <ModalContent sx={styles.modalStyle}>
                    <ModalHeader>{renderEditAvatarModalHeader()}</ModalHeader>
                    {/* Infinite Scroll Pagination requires id of a DOM. */}
                    <ModalBody id="scrollable" sx={styles.modalBody}>
                        <Flex
                            sx={styles.modalBodyContainerFlexSx}
                            id="modalBodyContainerFlexSx"
                        >
                            {renderAvatarChosen()}
                            {renderPfpsOwnedAndThemes()}
                        </Flex>
                        {/*
                        <GeneratedAvatarSection
                            seed={userDB?.walletProvider?.address || "default-seed"}
                            onSaveAsProfile={handleSaveGeneratedAvatar}
                        />
                        */}
                    </ModalBody>
                    <Divider sx={styles.dividerSx} />
                    <ModalFooter>{renderEditAvatarModalFooter()}</ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default AvatarCollection;
