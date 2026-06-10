import { THEME_COLOR_SECONDARY } from "@/constants";
import { Button, ButtonProps } from "@chakra-ui/react";
import React from "react";

interface OAuthButtonProps extends ButtonProps {
    Icon: React.ElementType;
    label: string;
}

const OAuthButton: React.FC<OAuthButtonProps> = ({
    Icon,
    label,
    color,
    onClick,
    isDisabled = false,
    ...props
}) => (
    <Button
        leftIcon={<Icon size="24px" />}
        color={color}
        onClick={onClick}
        w="full"
        variant="outline"
        isDisabled={isDisabled}
        _hover={{ color: THEME_COLOR_SECONDARY, bg: "white" }}
        {...props}
    >
        {label}
    </Button>
);

export default OAuthButton;
