import { AddIcon } from "@chakra-ui/icons";
import { Button, ButtonProps, Icon } from "@chakra-ui/react";
import { MouseEventHandler } from "react";

interface AddIconUIButtonProps extends ButtonProps {
    text?: string;
    showIcon?: boolean;
    onClick?: MouseEventHandler<HTMLButtonElement> | undefined;
}

const addIconUIButtonSx = {
    textTransform: "uppercase",
    border: "1px",
    _hover: { bg: "whiteAlpha.500" },
    borderRadius: "md",
    fontSize: "sm",
    px: "8px",
    height: 8,
    color: "white",
};

/**
 * Renders an Add Icon Button Component (with optional text)
 * @param text
 * @param showIcon
 * @param onClick
 * @returns JSX
 */
export const AddIconUIButton: React.FC<AddIconUIButtonProps> = ({
    text,
    showIcon = true,
    onClick,
    ...rest
}: AddIconUIButtonProps) => {
    if (showIcon) {
        return (
            <Button
                variant={"ghost"}
                {...rest}
                sx={addIconUIButtonSx}
                leftIcon={<Icon as={AddIcon} fontSize={"2xs"} />}
                onClick={onClick}
            >
                {text}
            </Button>
        );
    } else {
        return (
            <Button
                variant={"ghost"}
                {...rest}
                sx={addIconUIButtonSx}
                onClick={onClick}
            >
                {text}
            </Button>
        );
    }
};
