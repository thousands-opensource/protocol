import { useContext } from "react";
import * as styles from "../styles";
import { Wrap } from "@chakra-ui/react";
import BadgeAvatar from "../../../Badge/BadgeAvatar";
import ProfileContext from "@/features/Wildfile/WildfileContext";
import { IBadge } from "@repo/interfaces";

interface BadgeCollectionProps {
    setSelectedBadge: (badge: IBadge) => void;
    handleChangeWildfileTab: (index: number) => void;
}

const BadgeCollection = ({
    setSelectedBadge,
    handleChangeWildfileTab,
}: BadgeCollectionProps) => {
    const { pageOwnerUser, badges } = useContext(ProfileContext);

    return (
        <Wrap id={"badge-container"} sx={styles.WrapSx} justify={"start"}>
            {badges.map((badge: IBadge) => {
                const ownsBadge = badge.userIds.includes(
                    pageOwnerUser._id?.toString() || ""
                );
                if (!ownsBadge) {
                    return null;
                }

                return (
                    <BadgeAvatar
                        key={badge.id}
                        badge={badge}
                        sx={styles.mainBadgeImageSx}
                        onClick={() => {
                            setSelectedBadge(badge);
                            handleChangeWildfileTab(3);
                        }}
                    />
                );
            })}
        </Wrap>
    );
};
export default BadgeCollection;
