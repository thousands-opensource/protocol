import React from "react";
import { Flex, Button } from "@chakra-ui/react";
import { THEME_COLOR_SECONDARY } from "@/constants";

interface ModalCompleteButtonProps {
    buttonText: string;
    redirectUrl: string;
    isDisabled?: boolean;
}

const ModalCompleteButton: React.FC<ModalCompleteButtonProps> = ({
    redirectUrl,
    buttonText,
    isDisabled,
}) => {
    return (
        <Flex flexDirection="row" justifyContent="flex-end" mr="20px">
            <Button
                bg="glass.bg"
                border="1px solid"
                borderColor={THEME_COLOR_SECONDARY}
                onClick={() => (window.location.href = redirectUrl)}
                isDisabled={isDisabled || false}
            >
                {buttonText}
            </Button>
        </Flex>
    );
};

export default ModalCompleteButton;
