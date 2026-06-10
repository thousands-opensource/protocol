import {
    Box,
    ButtonProps,
    useTab,
    useMultiStyleConfig,
    Button,
} from "@chakra-ui/react";
import { ReactNode } from "react";
import * as styles from "./styles";
import { ColorObject } from "@/types";
import { gilroySemiBold } from "@/utils/themeUtil";

interface WildfileTabProps {
    avatarThemeColor?: ColorObject | undefined;
    children: ReactNode[];
}

/**
 * Renders a accessible tab that serves as a label for one of the tab panels and can be activated to display that panel.
 */
const WildfileTab = (props: WildfileTabProps) => {
    const { children, avatarThemeColor, ...rest } = props;
    const buttonTabProps: ButtonProps = useTab({
        ...rest,
    });
    const isSelected = !!buttonTabProps["aria-selected"];
    const buttonStyles = useMultiStyleConfig("Tabs", buttonTabProps);

    return (
        <Button
            __css={buttonStyles.tab}
            {...buttonTabProps}
            className={gilroySemiBold.className}
            sx={styles.ghostTabButton(avatarThemeColor, isSelected)}
        >
            {children}
        </Button>
    );
};

export default WildfileTab;
