import { useEffect, useState } from "react";
import axios from "axios";
import { IUser } from "@repo/interfaces";
import { WildcardApiResponse } from "@repo/interfaces";

/**
 * Fetch user by wallet address
 * @param address - wallet address
 * @param userId - user id
 * @returns user, isFetchingUser, fetchUserError, updateUser
 */
export default function useFetchUser(address?: string, userId?: string) {
    const [user, setUser] = useState<IUser | undefined>(undefined);
    const [isFetchingUser, setIsFetchingUser] = useState<boolean>(true);
    const [fetchUserError, setFetchUserError] = useState<string>("");

    async function fetchUser() {
        try {
            setIsFetchingUser(true);

            // TODO: userId not being called in `/api/fetchUser?walletAddress=${address}&userId=${userId}`, remove or determine use case
            const response = await axios.get(
                `/api/fetchUser?walletAddress=${address}&userId=${userId}`
            );
            const war: WildcardApiResponse = response.data;
            if (war.success && war.data) {
                setUser(war.data);
            } else {
                setUser(undefined);
                setFetchUserError(
                    war.err || `Error fetching user for address ${address}`
                );
            }
        } catch (e: any) {
            console.error("Failed to fetch user from database", e);
            setIsFetchingUser(false);
            setFetchUserError(e.message);
        }

        setIsFetchingUser(false);
    }

    function updateUser(iUser: IUser | undefined) {
        setUser(iUser);
    }

    useEffect(() => {
        if (!address && !userId) {
            setIsFetchingUser(false);
            return;
        }

        fetchUser();
    }, [address, userId]);

    return {
        user,
        isFetchingUser,
        fetchUserError,
        updateUser,
    };
}
