import { TabList } from "@chakra-ui/react";
import { WildfileMainIcon } from "../Icons/WildfileMainIcon";
import { WildfileShowcaseIcon } from "../Icons/WildfileShowcaseIcon";
import WildfileTab from "../WildfileTab";
import { ColorObject } from "@/types";
import * as styles from "./styles";
import { WildfileLeaderboardsIcon } from "../Icons/WildfileLeaderboardsIcon";
import { WildfileBadgeIcon } from "../Icons/WildfileBadgeIcon";
import { WildfileStoreIcon } from "../Icons/WildfileStoreIcon";
import { WildfileEventsIcon } from "../Icons/WildfileEventsIcon";
import { WildfileChatsIcon } from "../Icons/WildfileChatsIcon";

export interface WildfileTabListProps {
    avatarThemeColor?: ColorObject | undefined;
}

/**
 * Renders a wrapper for WildfileTab components
 */
const WildfileTabList = ({ avatarThemeColor }: WildfileTabListProps) => {
    return (
        //maxW="200px"
        <TabList sx={styles.tabListSx}>
            <WildfileTab avatarThemeColor={avatarThemeColor}>
                <WildfileMainIcon sx={styles.tabIconSx} />
                Main
            </WildfileTab>
            <WildfileTab avatarThemeColor={avatarThemeColor}>
                <WildfileEventsIcon sx={styles.tabIconSx} />
                Event
            </WildfileTab>
            <WildfileTab avatarThemeColor={avatarThemeColor}>
                <WildfileStoreIcon sx={styles.tabIconSx} />
                Store
            </WildfileTab>
            <WildfileTab avatarThemeColor={avatarThemeColor}>
                <WildfileChatsIcon sx={styles.tabIconSx} />
                Chats
            </WildfileTab>
            <WildfileTab avatarThemeColor={avatarThemeColor}>
                <WildfileShowcaseIcon sx={styles.tabIconSx} />
                Showcase
            </WildfileTab>
            <WildfileTab avatarThemeColor={avatarThemeColor}>
                <WildfileLeaderboardsIcon sx={styles.tabIconSx} />
                Leaderboards
            </WildfileTab>
            <WildfileTab avatarThemeColor={avatarThemeColor}>
                <WildfileBadgeIcon sx={styles.tabIconSx} />
                Badge
            </WildfileTab>
        </TabList>
    );
};
export default WildfileTabList;
