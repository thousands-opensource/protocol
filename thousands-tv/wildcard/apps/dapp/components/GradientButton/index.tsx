import { THEME_GRADIENT } from "@/constants/constants";
import { buttonHeight, buttonMinWidth, buttonSize } from "@/utils/themeUtil";
import { Button, ButtonProps } from "@chakra-ui/react";
import React from "react";

interface GradientButton extends ButtonProps {
    label: string;
}

const GradientButton: React.FC<GradientButton> = ({ label, ...rest }) => {
    return (
        <Button
            bgGradient={THEME_GRADIENT}
            color={"white"}
            size={buttonSize}
            minW={buttonMinWidth}
            h={buttonHeight}
            _hover={{ opacity: 0.8 }}
            _active={{ bgGradient: THEME_GRADIENT }}
            {...rest}
        >
            {label}
        </Button>
    );
};

export default GradientButton;
