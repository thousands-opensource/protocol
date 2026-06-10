import { useState } from "react";
import axios from "axios";
import { UserDoc } from "@repo/schemas";

interface SuspendUserResult {
    suspendedUser: UserDoc | null;
    isLoading: boolean;
    error: string | null;
    suspendUser: (userId: string, suspendedUntil?: Date) => Promise<boolean>;
}

/**
 * Hook to suspend a user
 */
const useSuspendUser = (): SuspendUserResult => {
    const [suspendedUser, setSuspendedUser] = useState<UserDoc | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const suspendUser = async (
        userId: string,
        suspendedUntil?: Date
    ): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.post(
                "/api/auth/suspend-user",
                {
                    userId,
                    suspendedUntil,
                },
                {
                    headers: {
                        accept: "application/json",
                        "content-type": "application/json",
                    },
                }
            );

            setSuspendedUser(response.data.data);
            setIsLoading(false);
            return true;
        } catch (error: any) {
            console.error("Error suspending user:", error);
            setError(
                error.response?.data?.message ||
                    "An error occurred while suspending the user"
            );
            setIsLoading(false);
            return false;
        }
    };

    return { suspendedUser, isLoading, error, suspendUser };
};

export default useSuspendUser;
