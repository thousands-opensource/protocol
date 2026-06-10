import React from "react";
import { Button, Portal, useToast, Text } from "@chakra-ui/react";
import { useClaimTicketForWildpassOwner } from "@/hooks/claimedTickets/useClaimTicketForWildpassOwner";
import { confirmButtonSx } from "../styles";
import { LoadingOverlay } from "@/components/LoadingOverlay";

interface ClaimTicketButtonForWildPassOwnerProps {
    stageId: string | null;
    seriesId: string | null;
    eventId: string | null;
    serverCode: string | null;
}

/**
 * Claim ticket button for wildpass owner
 */
const ClaimTicketButtonForWildPassOwner = ({
    stageId,
    seriesId,
    eventId,
    serverCode,
}: ClaimTicketButtonForWildPassOwnerProps) => {
    const toast = useToast();
    const { claimTicket, loading, error } = useClaimTicketForWildpassOwner();

    if (!stageId || !seriesId || !eventId || !serverCode) {
        return toast({
            title: `Unable to claim ticket. It appears that the required information is missing. Please contact support.`,
            description: "",
            status: "error",
            duration: 9000,
            isClosable: true,
            position: "top",
        });
    }

    const handleClaimTicket = () => {
        claimTicket({ stageId, seriesId, eventId, serverCode });
    };

    const renderLoadingEnteringStageOverlayJSX = () => {
        if (loading) {
            return (
                <Portal>
                    <LoadingOverlay message="Entering Stage..." />
                </Portal>
            );
        }
    };

    return (
        <>
            {renderLoadingEnteringStageOverlayJSX()}
            <Button
                sx={confirmButtonSx}
                onClick={handleClaimTicket}
                isLoading={loading}
                isDisabled={loading}
            >
                Enter Event (Wildpass Holder)
            </Button>

            {error && (
                <Text color="red" fontSize={"sm"}>
                    {error}
                </Text>
            )}
        </>
    );
};

export default ClaimTicketButtonForWildPassOwner;
