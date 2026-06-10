import { ChakraNextImageSimple } from "@/components/Image/ChakraNextImageSimple";
import { Box, Checkbox, CircularProgress, useToast } from "@chakra-ui/react";
import { Dispatch, SetStateAction, useState } from "react";
import * as styles from "./styles";
import HeartIcon from "../HeartIcon";
import {
    MAX_FAVORITE_PFPS,
    toastDefaultOptions,
    TOO_MANY_FAVORITES_ERR,
} from "@/constants/constants";
import { AccountProviderType, PfpMetadata } from "@repo/interfaces";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { getUserProviderPicture } from "@/utils/userUtil";

interface AvatarTileProps {
    tokenId?: string;
    name: string;
    imageUrl: string;
    contractAddress?: string;
    chainId?: number;
    accountProviderType: AccountProviderType;
    setPfpSelected: Dispatch<SetStateAction<PfpMetadata>>;
    pfpSelected: PfpMetadata;
    favoritePfpsSelected: PfpMetadata[];
    setFavoritePfpsSelected: Dispatch<SetStateAction<PfpMetadata[]>>;
}

const AvatarTile = ({
    tokenId,
    name,
    imageUrl,
    contractAddress,
    chainId,
    accountProviderType,
    setPfpSelected,
    pfpSelected,
    favoritePfpsSelected,
    setFavoritePfpsSelected,
}: AvatarTileProps) => {
    const { userDB } = useWildfileUserContext();
    const providerImg = getUserProviderPicture(userDB);
    const [isAvatarLoaded, setIsAvatarLoaded] = useState<boolean>(false);
    const toast = useToast();

    // Check whether PFP metadata are the same
    const isSamePfp = (otherPfp: PfpMetadata) => {
        return (
            otherPfp.imageUrl === imageUrl &&
            (!otherPfp.tokenId || otherPfp.tokenId === tokenId) &&
            (!otherPfp.contractAddress ||
                otherPfp.contractAddress === contractAddress)
        );
    };

    // Determine whether current avatar image tile is a favorite
    const isFavoritePfp = favoritePfpsSelected.some(
        (favoritePfp: PfpMetadata) => {
            return isSamePfp(favoritePfp);
        }
    );

    /**
     * Add or remove PFP to/from favorite list
     */
    const handleSelectedFavoritePfps = async () => {
        if (isFavoritePfp) {
            const updatedFavoritePfpsSelected = favoritePfpsSelected.filter(
                (favPfp: PfpMetadata) => !isSamePfp(favPfp)
            );
            setFavoritePfpsSelected(updatedFavoritePfpsSelected);
            return;
        }

        if (favoritePfpsSelected.length + 1 > MAX_FAVORITE_PFPS) {
            toast({
                ...toastDefaultOptions,
                description: `Unable to add ${name} profile picture to favorites. ${TOO_MANY_FAVORITES_ERR}`,
                status: "error",
                duration: 7000,
            });
            return;
        }

        const favPfp: PfpMetadata = {
            tokenId: tokenId || "",
            name,
            imageUrl,
            contractAddress: contractAddress || "",
            chainId: chainId || 0,
            accountProviderType,
        };
        setFavoritePfpsSelected([...favoritePfpsSelected, favPfp]);
    };

    /**
     * Set selected PFP to be displayed in profile
     */
    const handleSelectedPfp = () => {
        setPfpSelected({
            tokenId: tokenId || "",
            name,
            imageUrl,
            contractAddress: contractAddress || "",
            chainId: chainId || 0,
            accountProviderType,
        });
    };

    const renderAvatarTile = () => {
        if (!imageUrl) {
            return (
                <ChakraNextImageSimple
                    src={providerImg}
                    alt={name}
                    width={100}
                    height={100}
                    priority
                    bg="whiteAlpha.700"
                    sx={styles.imageSx(false)}
                />
            );
        }

        return (
            <Box overflow={"hidden"}>
                <ChakraNextImageSimple
                    src={imageUrl}
                    alt={name}
                    width={100}
                    height={100}
                    priority
                    onLoadingComplete={() => {
                        setIsAvatarLoaded(true);
                    }}
                    placeholder="blur"
                    blurDataURL={providerImg}
                    sx={styles.imageSx(isAvatarLoaded)}
                />
                <CircularProgress
                    isIndeterminate
                    color="black"
                    thickness={4}
                    position="absolute"
                    top="50%"
                    left="50%"
                    sx={styles.circularProgressSx(isAvatarLoaded)}
                    transform="translate(-50%, -50%)"
                />
            </Box>
        );
    };

    const renderHeartCheckButton = () => {
        if (!imageUrl) {
            return null;
        }

        return (
            <Checkbox
                position="absolute"
                top={2}
                right={2}
                css={styles.heartCheckboxCss(isFavoritePfp, isAvatarLoaded)}
                sx={styles.heartCheckboxSx}
                onChange={handleSelectedFavoritePfps}
                isChecked={isFavoritePfp}
                value={imageUrl}
                isIndeterminate={true}
                icon={<HeartIcon />}
            />
        );
    };

    return (
        <Box sx={styles.avatarTileBoxSx}>
            <Box
                onClick={handleSelectedPfp}
                borderRadius="8px"
                sx={styles.avatarBox(isSamePfp(pfpSelected))}
            >
                {renderAvatarTile()}
            </Box>
            <Checkbox
                css={styles.checkboxCss}
                sx={styles.checkboxSx}
                isChecked={isSamePfp(pfpSelected)}
                value={imageUrl}
            />
            {renderHeartCheckButton()}
        </Box>
    );
};

export default AvatarTile;
