import { gilroyBlack, gilroyBold } from "@/utils/themeUtil";
import { Box, Text } from "@chakra-ui/react";
import * as styles from "./styles";
import BadgeAvatar from "../BadgeAvatar";
import { IBadge } from "@repo/interfaces";

interface BadgeDetailsProps {
    selectedBadge: IBadge;
}

const BadgeDetails = ({ selectedBadge }: BadgeDetailsProps) => {
    return (
        <Box sx={styles.badgeDetailsContainerSx}>
            <Box>
                <Text
                    casing="uppercase"
                    sx={styles.badgeDetailTextSx}
                    className={gilroyBlack.className}
                >
                    Badge Details
                </Text>
            </Box>
            <Box sx={styles.badgeDetailsImageContainerSx}>
                <BadgeAvatar badge={selectedBadge} sx={styles.badgeImageSx} />
            </Box>
            <Text
                casing="uppercase"
                sx={styles.badgeNameTextSx}
                className={gilroyBlack.className}
            >
                {selectedBadge.name}
            </Text>
            <Box mt={-1}>
                <Text
                    sx={styles.badgeDescriptionTextSx}
                    className={gilroyBold.className}
                >
                    {selectedBadge.description}
                </Text>
            </Box>
        </Box>
    );
};

export default BadgeDetails;
