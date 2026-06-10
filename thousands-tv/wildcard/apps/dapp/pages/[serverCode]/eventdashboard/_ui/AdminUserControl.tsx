import React, { useState, useEffect, useCallback } from "react";
import { Button, Flex, Text, VStack, Spinner } from "@chakra-ui/react";
import useSuspendUser from "@/hooks/accountAdmin/useSuspendUser";
import useUnsuspendUser from "@/hooks/accountAdmin/useUnsuspendUser";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import { FaBan, FaCheck } from "react-icons/fa";
import UserAutoComplete from "./UserAutoComplete";
import useFetchUsersByEvent from "@/hooks/claimedTickets/useGetUsersByEvent";

interface AdminUserControlProps {
    eventId: string;
}

/**
 * Admin tool to suspend and unsuspend users
 */
const AdminUserControl: React.FC<AdminUserControlProps> = ({ eventId }) => {
    const {
        users,
        isLoading: isLoadingUsers,
        error: usersError,
        fetchUsers,
    } = useFetchUsersByEvent();
    const {
        suspendedUser,
        isLoading: isSuspending,
        error: suspendError,
        suspendUser,
    } = useSuspendUser();
    const {
        unsuspendedUser,
        isLoading: isUnsuspending,
        error: unsuspendError,
        unsuspendUser,
    } = useUnsuspendUser();
    const [selectedUserId, setSelectedUserId] = useState<string>("");

    const { onMessage } = useInfoNotifications();

    useEffect(() => {
        if (eventId) {
            fetchUsers(eventId);
        }
    }, [eventId, fetchUsers]);

    const handleSuspend = useCallback(async () => {
        const success = await suspendUser(selectedUserId);
        if (success) {
            onMessage({
                title: "Success",
                description: `User ${selectedUserId} has been suspended`,
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            fetchUsers(eventId);
        }
    }, [selectedUserId, suspendUser, onMessage, fetchUsers, eventId]);

    const handleUnsuspend = useCallback(async () => {
        const success = await unsuspendUser(selectedUserId);
        if (success) {
            onMessage({
                title: "Success",
                description: `User ${selectedUserId} has been unsuspended`,
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            fetchUsers(eventId);
        }
    }, [selectedUserId, unsuspendUser, onMessage, fetchUsers, eventId]);

    if (isLoadingUsers) {
        return <Spinner />;
    }

    if (usersError) {
        return <Text color="red.500">Error loading users: {usersError}</Text>;
    }

    return (
        <VStack spacing={4}>
            <UserAutoComplete
                users={users}
                onChange={setSelectedUserId}
                value={selectedUserId}
                isDisabled={isSuspending || isUnsuspending}
            />
            <Flex flexDirection="row" gap="10px">
                <Button
                    colorScheme="red"
                    onClick={handleSuspend}
                    isLoading={isSuspending}
                    isDisabled={!selectedUserId || isSuspending}
                    leftIcon={<FaBan />}
                >
                    Suspend User
                </Button>
                <Button
                    onClick={handleUnsuspend}
                    isLoading={isUnsuspending}
                    isDisabled={!selectedUserId || isUnsuspending}
                    leftIcon={<FaCheck />}
                >
                    Unsuspend User
                </Button>
            </Flex>
            {(suspendError || unsuspendError) && (
                <Text color="red.500">{suspendError || unsuspendError}</Text>
            )}
            {suspendedUser && (
                <Text color="green.500">
                    User {suspendedUser?._id.toString()} suspended until{" "}
                    {suspendedUser?.suspendedUntil?.toString()}
                </Text>
            )}
            {unsuspendedUser && (
                <Text color="green.500">
                    User {unsuspendedUser?._id.toString()} has been unsuspended.
                </Text>
            )}
        </VStack>
    );
};

export default AdminUserControl;
