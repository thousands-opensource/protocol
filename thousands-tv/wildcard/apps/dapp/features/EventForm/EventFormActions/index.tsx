import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import { Box, Button, Flex, useDisclosure } from "@chakra-ui/react";
import axios from "axios";
import Link from "next/link";
import { formatRouteConfigUrl } from "../../../utils/routeUtil";
import { WILDFILE_ROUTES } from "../../../constants/routes";

interface Props {
    isSubmitting: boolean;
    isSubmitted?: boolean;
    eventId?: string;
    serverCode: string;
}
const EventFormActions: React.FC<Props> = ({
    isSubmitting,
    eventId,
    isSubmitted,
    serverCode,
}) => {
    const isUpdate = eventId!!;
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { onMessage } = useInfoNotifications();

    const handleEventDelete = async (objectId: string) => {
        try {
            const response = await axios.delete(
                `/api/beamable/event/delete?objectId=${objectId}`
            );

            if (!response.data) {
                onMessage({
                    title: "Error",
                    description: `Failed to delete event`,
                    status: "error",
                });

                return;
            }

            onMessage({
                title: "Success",
                description: "Event successfully deleted",
                status: "success",
            });
        } catch (err: any) {
            onMessage({
                title: "Error",
                description: `${
                    err.response.data.message || "An error occurred"
                }`,
                status: "error",
            });
        }
    };
    if (!isUpdate) {
        const formattedEventDashboardRouteUrl = formatRouteConfigUrl(
            WILDFILE_ROUTES.SERVER.EVENT_DASHBOARD.BASE
                .url,
            { serverCode }
        );

        return (
            <Box mt={4}>
                {/* Conditionally render button based on isSubmitted */}
                {!isSubmitted ? (
                    <Button
                        colorScheme="blue"
                        type="submit"
                        isLoading={isSubmitting}
                    >
                        Create
                    </Button>
                ) : (
                        <Link href={formattedEventDashboardRouteUrl}>
                        <Button colorScheme="green">View Dashboard</Button>
                    </Link>
                )}
            </Box>
        );
    }

    return (
        <>
            <Flex mt={4} gap="10px" justifyContent={"space-between"}>
                <Button
                    bg="red.500"
                    onClick={() => {
                        onOpen();
                    }}
                >
                    Delete
                </Button>
                <Button
                    colorScheme="blue"
                    type="submit"
                    isLoading={isSubmitting}
                >
                    Update
                </Button>
            </Flex>
            <DeleteConfirmationModal
                isOpen={isOpen}
                onClose={onClose}
                onConfirm={() => {
                    handleEventDelete(eventId);
                }}
                modalTitle="Delete Event"
                itemToDeleteName={"this Event"}
            />
        </>
    );
};

export default EventFormActions;
