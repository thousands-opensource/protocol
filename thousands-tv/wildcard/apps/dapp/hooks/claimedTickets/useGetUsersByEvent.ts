import { useState, useCallback } from "react";
import axios from "axios";
import { IUser } from "@repo/interfaces";

interface FetchUsersByEventResult {
    users: IUser[];
    isLoading: boolean;
    error: string | null;
    fetchUsers: (eventId: string) => Promise<void>;
}

/**
 * Hook to fetch all users who have claimed a ticket for a specific event
 */
const useFetchUsersByEvent = (): FetchUsersByEventResult => {
    const [users, setUsers] = useState<IUser[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = useCallback(async (eventId: string): Promise<void> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.get(
                `/api/claimedTickets/getUsersByStageId?stageId=${eventId}`
            );
            setUsers(response.data.users);
        } catch (error: any) {
            console.error("Error fetching users by event:", error);
            setError(
                error.response?.data?.message ||
                    "An error occurred while fetching users"
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { users, isLoading, error, fetchUsers };
};

export default useFetchUsersByEvent;
