import { useContext, useState } from "react";
import {
    Flex,
    Box,
    Grid,
    Text,
    useMediaQuery,
    useDisclosure,
} from "@chakra-ui/react";
import { ColorObject } from "@/types";
import { gilroyBlack, gilroyRegular } from "@/utils/themeUtil";
import MyBadgesSVG from "./HeaderSVG/MyBadgesSVG";
import BadgeDetails from "./BadgeDetails";
import BadgeCard from "./BadgeCard";
import ProfileContext from "../../WildfileContext";
import { IBadge } from "@repo/interfaces";
import BadgeModal from "./BadgeModal";
import * as styles from "./styles";

interface BadgeProps {
    avatarThemeColor: ColorObject;
    setSelectedBadge: (badge: IBadge) => void;
    selectedBadge: IBadge;
}

const Badge = ({
    avatarThemeColor,
    setSelectedBadge,
    selectedBadge,
}: BadgeProps) => {
    const { badges } = useContext(ProfileContext);
    const [isSmallerThan992] = useMediaQuery("(max-width: 992px)", {
        ssr: true,
        fallback: false,
    });
    const { isOpen, onOpen, onClose } = useDisclosure();

    /**
     * Select a badge to view additional information
     * @param badge - a badge object
     */
    const handleSelectedBadge = (badge: IBadge) => {
        setSelectedBadge(badge);
        if (isSmallerThan992) {
            onOpen();
        }
    };

    /**
     * Close modal for Badge Details component
     */
    const handleClose = () => {
        onClose();
    };

    /**
     * Render Badge Header component
     * @returns badge header jsx
     */
    const renderBagdesHeaderJsx = () => {
        return (
            <Box>
                <MyBadgesSVG avatarThemeColor={avatarThemeColor} />
            </Box>
        );
    };

    /**
     * Render different badge category
     * @returns badge category chip jsx
     */
    const renderBadgeCategoryJsx = () => {
        return (
            <Box>
                <Text
                    casing="uppercase"
                    sx={styles.badgeAllSx}
                    className={gilroyBlack.className}
                >
                    All{" "}
                    <Text
                        as={"span"}
                        sx={styles.badgeLengthSx}
                        className={gilroyRegular.className}
                    >
                        ({badges.length})
                    </Text>
                </Text>
            </Box>
        );
    };

    /**
     * Render list of badge card component
     * @returns badge grid jsx
     */
    const renderBadgeList = () => {
        return (
            <Grid sx={styles.badgeListSx}>
                {badges.map((badge: IBadge, index) => {
                    return (
                        <BadgeCard
                            key={index}
                            badge={badge}
                            selectedBadge={selectedBadge}
                            isSmallerThan992={isSmallerThan992}
                            handleSelectedBadge={handleSelectedBadge}
                        />
                    );
                })}
            </Grid>
        );
    };

    /**
     * Render Badge Details component depending on the screen size
     * @returns jsx component
     */
    const renderBadgeDetails = () => {
        if (!selectedBadge) {
            return null;
        }

        if (isSmallerThan992) {
            return (
                <BadgeModal isOpen={isOpen} handleClose={handleClose}>
                    <Flex sx={styles.badgeDetailsWrapperSx}>
                        <BadgeDetails selectedBadge={selectedBadge} />
                    </Flex>
                </BadgeModal>
            );
        }

        return <BadgeDetails selectedBadge={selectedBadge} />;
    };

    return (
        <Flex id="badges" sx={styles.badgeContainerSx}>
            {renderBagdesHeaderJsx()}
            <Flex>
                <Flex sx={styles.badgeListFlexContainerSx}>
                    {renderBadgeCategoryJsx()}
                    {renderBadgeList()}
                </Flex>
                {renderBadgeDetails()}
            </Flex>
        </Flex>
    );
};

export default Badge;
