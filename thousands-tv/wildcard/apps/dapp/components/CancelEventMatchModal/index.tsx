import { useGlobalContext } from "@/contexts/globalContext";
import { EventCreationPayload } from "@repo/interfaces";
import { fetchEventDetails } from "@/utils/eventUtil";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    Button,
    useToast,
} from "@chakra-ui/react";
import axios from "axios";
import { Dispatch, SetStateAction } from "react";

export const CancelEventMatchModal: React.FC<{
    matchId?: string;
    vendorEventId?: string;
    setMatchToCancel: Dispatch<
        SetStateAction<{
            vendorEventId: string;
            matchId: string;
        } | null>
    >;
    setEvent: React.Dispatch<React.SetStateAction<EventCreationPayload | null>>;
}> = ({ matchId, vendorEventId, setMatchToCancel, setEvent }) => {
    const { setLoadingSpinner } = useGlobalContext();
    const toast = useToast();
    const isOpen = !!matchId && !!vendorEventId;
    const onClose = () => {
        setMatchToCancel(null);
    };

    const onConfirmCancel = async () => {
        if (!vendorEventId || !matchId) {
            return;
        }
        setLoadingSpinner(true);
        try {
            const response = await axios.post("/api/events/cancelEventMatch", {
                vendorEventId,
                matchId,
            });
            if (response.data.success) {
                const updatedEvent = await fetchEventDetails(vendorEventId);
                if (updatedEvent) {
                    setEvent(updatedEvent);
                }
            }
        } catch (e: any) {
            const msg = `Error canceling event match: ${e.message}`;
            console.error(msg);
            toast({
                description: msg,
                status: "error",
                duration: 5000,
                position: "top",
            });
        }

        setLoadingSpinner(false);
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Cancel Match {`"${matchId}"`}?</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    Are you sure you want to cancel this match?
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose}>
                        Go Back
                    </Button>
                    <Button
                        colorScheme={"red"}
                        onClick={() => {
                            onConfirmCancel();
                            onClose();
                        }}
                    >
                        Confirm Cancel
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
