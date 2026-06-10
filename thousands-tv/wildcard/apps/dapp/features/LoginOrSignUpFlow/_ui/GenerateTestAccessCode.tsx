import React, { useState } from "react";
import { Button, Text, VStack } from "@chakra-ui/react";
import axios from "axios";
import { AccessCodeType, UserRole, AccessCodeIntent } from "@repo/interfaces"; // Removed TicketTierType

/**
 * Admin Test Component to generate a test access code with the intent of ACCESS_ROLE
 * @returns
 */
const GenerateTestAccessCode: React.FC = () => {
    const [accessCode, setAccessCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateAccessCode = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.post(
                "/api/accessCode/generateAccessCode",
                {
                    organizationId: null,
                    isClaimed: false,
                    codeType: AccessCodeType.SINGLE_USE,
                    count: 1,
                    maxQuantity: 1,
                    intent: AccessCodeIntent.ACCESS_ROLE, // Set the intent to ACCESS_ROLE
                    accessRoles: [UserRole.COMPETITOR], // Pass the access roles
                }
            );

            if (
                response.data.accessCodes &&
                response.data.accessCodes.length > 0
            ) {
                setAccessCode(response.data.accessCodes[0]);
            } else {
                setError("No access code generated");
            }
        } catch (error: any) {
            setError(
                error.response?.data?.message ||
                    "Failed to generate access code"
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <VStack spacing={4} align="stretch">
            <Button
                onClick={generateAccessCode}
                isLoading={isLoading}
                colorScheme="blue"
            >
                Generate Test Access Code
            </Button>
            {accessCode && (
                <Text fontSize="lg" fontWeight="bold">
                    Generated Access Code: {accessCode}
                </Text>
            )}
            {error && <Text color="red.500">Error: {error}</Text>}
        </VStack>
    );
};

export default GenerateTestAccessCode;
