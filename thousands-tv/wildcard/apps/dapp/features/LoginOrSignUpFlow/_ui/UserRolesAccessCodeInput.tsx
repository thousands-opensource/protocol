import React, { useState } from "react";
import { Flex, Button, Input, Text, VStack, Spinner } from "@chakra-ui/react";
import axios from "axios";
import { linkWalletButtonSX } from "@/features/Wildfile/WildFileProfile/WildfileAccountsFlowPopups/styles";
import { THEME_COLOR_SECONDARY } from "@/constants";

interface AccessCodeInputProps {
    setValidAccessCode: (accessCode: string) => void;
}

/**
 * User input for access code on the login or sign-up flow.
 * Handles trimming input for whitespace and keeps the original casing.
 */
const UserRolesAccessCodeInput: React.FC<AccessCodeInputProps> = ({
    setValidAccessCode,
}) => {
    const [accessCode, setAccessCode] = useState("");
    const [showInput, setShowInput] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isDisabled, setIsDisabled] = useState(false);
    const [isApplied, setIsApplied] = useState(false);

    /**
     * Validates the access code by sending it to the server for validation.
     * @param {string} code - The access code to validate.
     * @returns {Promise<{isValid: boolean, message: string}>} - The result of the validation.
     */
    const validateAccessCode = async (
        code: string
    ): Promise<{
        isValid: boolean;
        message: string;
    }> => {
        setLoading(true);
        try {
            const response = await axios.get(
                `/api/accessCode/validateAccessCode`,
                {
                    params: { code },
                }
            );

            const { data } = response;

            return {
                isValid: data.data.isValid,
                message: data.message,
            };
        } catch (error: any) {
            setError(
                error.response?.data?.message ||
                    "Failed to validate access code"
            );
            return {
                isValid: false,
                message:
                    error.response?.data?.message || "Something went wrong",
            };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handle submit access code button click.
     */
    const handleSubmitAccessCode = async () => {
        setIsDisabled(true);
        const trimmedCode = accessCode.trim(); // Trim white spaces

        const { isValid, message } = await validateAccessCode(trimmedCode);
        if (isValid) {
            setError(null);
            setValidAccessCode(trimmedCode); // set the valid access code (pass to parent)
            setIsApplied(true);
        } else {
            setError(message || "Invalid access code. Please try again.");
        }

        setIsDisabled(false);
    };

    return (
        <Flex direction="column" align="center" mt={4}>
            {!showInput ? (
                <Button
                    onClick={() => setShowInput(true)}
                    variant="link"
                    color={THEME_COLOR_SECONDARY}
                >
                    Have an access code?
                </Button>
            ) : (
                <VStack spacing={2} align="stretch" w="100%">
                    <Flex flexDirection={"row"} gap="5px">
                        <Input
                            placeholder="Enter access code"
                            value={accessCode}
                            onChange={(e) => {
                                setAccessCode(e.target.value);
                                setError(null);
                            }}
                            isDisabled={isDisabled || loading || isApplied}
                        />
                        <Button
                            onClick={handleSubmitAccessCode}
                            sx={{
                                ...linkWalletButtonSX,
                                maxWidth: "fit-content",
                            }}
                            isDisabled={isDisabled || loading || isApplied}
                        >
                            {loading ? (
                                <Spinner size="sm" />
                            ) : isApplied ? (
                                "Applied"
                            ) : (
                                "Apply Code"
                            )}
                        </Button>
                    </Flex>
                    {error && (
                        <Text
                            color="red.500"
                            fontSize="xs"
                            textAlign={"center"}
                        >
                            {error}
                        </Text>
                    )}
                </VStack>
            )}
        </Flex>
    );
};

export default UserRolesAccessCodeInput;
