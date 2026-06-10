import React, { useState } from "react";
import { Button, Spinner, Text, Alert, AlertIcon } from "@chakra-ui/react";
import useAddCredits from "@/hooks/credits/useAddCredits";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";

/**
 * Demo purposes: component to add credits to the user's account.
 * @dev - this would be a restricted API call via an AWS callback
 * @returns
 */
const AddCreditsButton = () => {
    const [transactionId, setTransactionId] = useState("txn1234567");
    const [amount, setAmount] = useState(100);
    const [currency, setCurrency] = useState("USD");
    const [paymentMethod, setPaymentMethod] = useState("credit card");
    const [paymentGateway, setPaymentGateway] = useState("Stripe");
    const [status, setStatus] = useState("completed");

    const { userDB } = useWildfileUserContext();
    const userId = userDB?._id;
    const userIdString = userId?.toString();

    const { addCredits, isLoading, error, success, message } = useAddCredits();

    const handleAddCredits = () => {
        if (!userIdString) {
            console.error("User ID is missing");
            return;
        }
        addCredits({
            userId: userIdString,
            transactionId,
            amount,
            currency,
            paymentMethod,
            paymentGateway,
            status,
        });
    };

    const renderLoadingSpinner = () => {
        if (isLoading) {
            return <Spinner size="xl" color="teal" mt={4} />;
        }
    };

    const renderSuccessMessageJSX = () => {
        if (success) {
            return (
                <Alert status="success" mt={4}>
                    <AlertIcon />
                    {message}
                </Alert>
            );
        }
    };

    const renderErrorMessageJSX = () => {
        if (error) {
            return (
                <Alert status="error" mt={4}>
                    <AlertIcon />
                    {message || error}
                </Alert>
            );
        }
    };

    return (
        <>
            <Button
                onClick={handleAddCredits}
                colorScheme="teal"
                isLoading={isLoading}
                loadingText="Processing"
            >
                Add Credits
            </Button>
            {renderLoadingSpinner()}
            {renderSuccessMessageJSX()}
            {renderErrorMessageJSX()}
        </>
    );
};

export default AddCreditsButton;
