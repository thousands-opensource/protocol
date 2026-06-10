import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import React from "react";

interface AddToCollectionProps extends IconButtonProps {
    url: string;
}

const addButtonSx = {
    ariaLabel: "Add",
    size: "xs",
    borderRadius: "full",
    w: "20px",
    h: "20px",
    minWidth: "15px",
    minHeight: "15px",
    fontSize: "10px",
    border: "1px",
    _hover: { bg: "whiteAlpha.500" },
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
};

/**
 * Renders an Add To Collection Button Component
 * @returns JSX
 */
const AddToCollectionButton: React.FC<AddToCollectionProps> = ({
    url,
    ...rest
}) => {
    return (
        <IconButton
            {...rest}
            sx={addButtonSx}
            icon={<AddIcon />}
            onClick={() => window.open(url, "_blank")}
        />
    );
};

export default AddToCollectionButton;
