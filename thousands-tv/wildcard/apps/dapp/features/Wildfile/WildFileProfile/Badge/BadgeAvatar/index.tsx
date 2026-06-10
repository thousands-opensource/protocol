import { Box, Image, SystemStyleObject } from "@chakra-ui/react";
import { useContext } from "react";
import { WILDFILE_ASSETS_BADGE_DIRECTORY } from "@/constants/constants";
import ProfileContext from "@/features/Wildfile/WildfileContext";
import { getBadgeId, getColorAmountForWildpasses } from "@/utils/util";
import { IBadge } from "@repo/interfaces";

interface BadgeAvatarProps {
    badge: IBadge;
    sx: SystemStyleObject;
    onClick?: () => void;
}

const BadgeAvatar = ({ badge, onClick, sx }: BadgeAvatarProps) => {
    const { pageOwnerUser, wildpasses } = useContext(ProfileContext);
    const ownsBadge = badge.userIds.includes(
        pageOwnerUser._id?.toString() || ""
    );

    // create object containing info on amount of each wildpass color
    const wildpassesColorAmounts = getColorAmountForWildpasses(wildpasses);
    const pageOwnerWildpassColors = Object.keys(wildpassesColorAmounts);
    // Fetch specific badge id for wildpass if it is wildpass holder otherwise uses original badge id
    const badgeId = getBadgeId(badge.id, pageOwnerWildpassColors);

    return (
        <Box
            loading="lazy"
            as={Image}
            opacity={ownsBadge ? 1 : 0.2}
            sx={sx}
            src={`${WILDFILE_ASSETS_BADGE_DIRECTORY}/${badgeId}.webp`}
            fallbackSrc={`${WILDFILE_ASSETS_BADGE_DIRECTORY}/fallback.webp`}
            onClick={onClick}
        />
    );
};

export default BadgeAvatar;
