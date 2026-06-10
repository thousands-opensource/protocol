import { useContext, useState } from "react";
import { Flex, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import * as styles from "./styles";
import ProfileContext from "@/features/Wildfile/WildfileContext";
import ShowcaseNavigation from "./ShowcaseNavigation";
import PreAlpha from "./PreAlpha";
import { ColorObject } from "@/types";

export enum ShowcaseTab {
    PREALPHA = 0,
}

export interface SwagSetStyles {
    [collection: string]: SwagSetStyle;
}

export interface SwagSetStyle {
    backgroundBorderGradient: string;
    leftPanelImageDesktopSrc: string;
    leftPanelImageMobileSrc: string;
    bannerHeight: string;
    templateColumns: string;
    templateRows?: string;
    rightPanelTop?: string | string[];
    rightPanelPaddingY?: string | string[];
    rightPanelHeight: string | string[];
    rightPanelBackgroundSize: string | string[];
    rightPanelBackgroundImageUrl: string | string[];
    colSpan?: number;
    collectThemAllSrc?: string;
    collectThemAllWidth?: string | string[];
    collectThemAllInset?: string | string[];
}

interface ShowcaseProps {
    avatarThemeColor: ColorObject;
}

const Showcase = ({ avatarThemeColor }: ShowcaseProps) => {
    const { swagSets } = useContext(ProfileContext);
    const [activeShowcaseTab, setActiveShowcaseTab] = useState<ShowcaseTab>(
        ShowcaseTab.PREALPHA
    );

    /**
     * A wrapper around the pre alpha collection and render pre alpha collection
     * @returns pre alpha collection
     */
    const renderPreAlpha = () => {
        return (
            <Flex sx={styles.preAlphaFlexWrapperSx}>
                <PreAlpha />
            </Flex>
        );
    };

    if (!swagSets || swagSets.length === 0) {
        return <></>;
    }

    return (
        <Flex sx={styles.containerVStackSx}>
            <ShowcaseNavigation
                activeShowcaseTab={activeShowcaseTab}
                setActiveShowcaseTab={setActiveShowcaseTab}
                avatarThemeColor={avatarThemeColor}
            />
            <Tabs isLazy={false} sx={styles.showcaseTabSx}>
                <TabPanels>
                    {activeShowcaseTab === ShowcaseTab.PREALPHA && (
                        <TabPanel sx={styles.showcaseTabPanelSx}>
                            {renderPreAlpha()}
                        </TabPanel>
                    )}
                </TabPanels>
            </Tabs>
        </Flex>
    );
};

export default Showcase;
