import { Box, ScaleFade, AvatarProps } from "@chakra-ui/react";
import React from "react";
import * as styles from "./styles";
import { HexagonSVGBlur } from "@/components/SVGImages";
import { getAvatarThemeColor } from "@/utils/themeUtil";
import { ColorObject } from "@/types";
import { PfpMetadata } from "@repo/interfaces";
import { alabasterColorObj } from "@/utils/wildpassUtil";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import {
    getUserProfilePicture,
    getUserProviderPicture,
} from "@/utils/userUtil";
import { PfpCircleProfile } from "@/components/PfpCircleProfile";

interface AvatarBackgroundGlowProps {
    avatarThemeColor: ColorObject;
    imageLoaded?: boolean;
}
/**
 * Add a glow effect to the avatar image (upon image load)
 */
export const AvatarBackgroundGlow = ({
    avatarThemeColor,
    imageLoaded = true,
}: AvatarBackgroundGlowProps) => {
    return (
        <Box sx={styles.avatarBackgroundGlowSx}>
            <ScaleFade
                in={imageLoaded}
                initialScale={0.4}
                transition={{
                    enter: { duration: 3 },
                }}
            >
                <HexagonSVGBlur
                    primaryColor={getAvatarThemeColor(avatarThemeColor)}
                />
            </ScaleFade>
        </Box>
    );
};

interface AvatarImageProps extends AvatarProps {
    avatarThemeColor: ColorObject;
    previewMode: boolean;
    pfpSelected?: PfpMetadata;
    colorSelected?: ColorObject;
}

/**
 * Render the avatar hex image component
 */
const AvatarImage = ({
    avatarThemeColor,
    previewMode,
    pfpSelected,
    colorSelected,
    ...rest
}: AvatarImageProps) => {
    const { userDB } = useWildfileUserContext();
    const profPicture = getUserProfilePicture(userDB);
    const providerImg = getUserProviderPicture(userDB); // fallback image for when user has no profile picture

    // Render custom avatar image with hexagon border
    const renderAvatarImage = (imageUrl: string) => {
        return (
            <PfpCircleProfile
                srcUrl={imageUrl}
                borderColor={
                    colorSelected?.hexValue || alabasterColorObj.hexValue
                }
                {...rest}
            />
        );
    };

    // Render default avatar silhouette image or custom avatar image
    const renderAvatarImageHandler = () => {
        if (!previewMode) {
            return renderAvatarImage(profPicture);
        }

        // render avatar selection preview image
        if (previewMode) {
            return renderAvatarImage(pfpSelected?.imageUrl || providerImg);
        }
    };

    return <>{renderAvatarImageHandler()}</>;
};

export default AvatarImage;
