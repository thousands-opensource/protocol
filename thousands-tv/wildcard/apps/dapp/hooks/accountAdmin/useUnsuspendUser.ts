import { useState } from "react";
import axios from "axios";
import { UserDoc } from "@repo/schemas";

interface UnsuspendUserResult {
    unsuspendedUser: UserDoc | null;
    isLoading: boolean;
    error: string | null;
    unsuspendUser: (userId: string) => Promise<boolean>;
}

/**
 * Hook to unsuspend a user
 */
const useUnsuspendUser = (): UnsuspendUserResult => {
    const [unsuspendedUser, setUnsuspendedUser] = useState<UserDoc | null>(
        null
    );
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const unsuspendUser = async (userId: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.post(
                "/api/auth/unsuspend-user",
                { userId },
                {
                    headers: {
                        accept: "application/json",
                        "content-type": "application/json",
                    },
                }
            );

            setUnsuspendedUser(response.data.data);
            setIsLoading(false);
            return true;
        } catch (error: any) {
            console.error("Error unsuspending user:", error);
            setError(
                error.response?.data?.message ||
                    "An error occurred while unsuspending the user"
            );
            setIsLoading(false);
            return false;
        }
    };

    return { unsuspendedUser, isLoading, error, unsuspendUser };
};

export default useUnsuspendUser;
