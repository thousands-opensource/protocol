import { GridItem } from "@chakra-ui/react";
import BadgeAvatar from "../BadgeAvatar";
import * as styles from "./styles";
import { IBadge } from "@repo/interfaces";

interface BadgeCardProps {
    badge: IBadge;
    selectedBadge: IBadge;
    isSmallerThan992: boolean;
    handleSelectedBadge: (badge: any) => void;
}

const BadgeCard = ({
    badge,
    selectedBadge,
    isSmallerThan992,
    handleSelectedBadge,
}: BadgeCardProps) => {
    /**
     * Get specific border style css for Badge Card component
     */
    const getBorderStyle = () => {
        if (
            !isSmallerThan992 &&
            selectedBadge &&
            selectedBadge.id === badge.id
        ) {
            return `2px solid white`;
        }

        return "transparent";
    };

    return (
        <GridItem
            sx={styles.badgeAvatarItem}
            border={getBorderStyle()}
            _hover={{
                border: !isSmallerThan992 ? `2px solid white` : "transparent",
            }}
            onClick={() => handleSelectedBadge(badge)}
        >
            <BadgeAvatar badge={badge} sx={styles.badgeImageSx} />
        </GridItem>
    );
};

export default BadgeCard;
