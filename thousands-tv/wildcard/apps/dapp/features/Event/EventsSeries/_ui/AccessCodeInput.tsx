import React, { useEffect, useState } from "react";
import {
    Flex,
    Button,
    Input,
    InputGroup,
    InputRightElement,
} from "@chakra-ui/react";

interface AccessCodeInputProps {
    isPromoCodeInputVisible: boolean;
    promoCode: string;
    setPromoCodeInputVisible: (visible: boolean) => void;
    setPromoCode: (code: string) => void;
    handlePromoCodeSubmit: () => void;
    hasClaimedTicket: boolean;
}

/**
 * Access code input field for users to enter a promo code
 */
const AccessCodeInput: React.FC<AccessCodeInputProps> = ({
    isPromoCodeInputVisible,
    promoCode,
    setPromoCodeInputVisible,
    setPromoCode,
    handlePromoCodeSubmit,
    hasClaimedTicket,
}) => {
    const [localInputVisible, setLocalInputVisible] = useState<boolean>(
        isPromoCodeInputVisible
    );

    /**
     * Handle visibility of the promo code input field (if user has claimed hide the input field by default)
     */
    useEffect(() => {
        if (hasClaimedTicket) {
            setLocalInputVisible(false);
            setPromoCodeInputVisible(false);
        } else {
            setLocalInputVisible(isPromoCodeInputVisible);
        }
    }, [hasClaimedTicket, isPromoCodeInputVisible, setPromoCodeInputVisible]);

    const togglePromoCodeInput = () => {
        const newVisibility = !localInputVisible;
        setLocalInputVisible(newVisibility);
        setPromoCodeInputVisible(newVisibility);
    };

    return (
        <Flex
            ml={[0, 0, 0, "35px"]}
            flexDirection={"column"}
            alignItems={"flex-start"}
            my="15px"
            mb="30px"
        >
            <Button
                variant="link"
                color="gray.500"
                fontSize="sm"
                textDecoration="underline"
                _hover={{
                    textDecoration: "underline",
                    color: "white",
                }}
                onClick={togglePromoCodeInput}
            >
                Do you have a code?
            </Button>

            {localInputVisible && (
                <Flex w="100%" mt="10px" alignItems="center">
                    <InputGroup
                        size="md"
                        width={["100%", "100%", "100%", "400px"]}
                    >
                        <Input
                            pr="4.5rem"
                            placeholder="Enter Code"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            w={["100%", "100%", "100%", "300px"]}
                        />
                        <InputRightElement width="4.5rem">
                            <Button
                                h="1.75rem"
                                size="sm"
                                onClick={handlePromoCodeSubmit}
                            >
                                Apply
                            </Button>
                        </InputRightElement>
                    </InputGroup>
                </Flex>
            )}
        </Flex>
    );
};

export default AccessCodeInput;
