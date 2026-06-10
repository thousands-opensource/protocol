import { UserSession } from "@repo/interfaces";

/**
 * Interface for the UserSessionCacheRepository
 * Handles storing and retrieving user sessions with authentication data in cache
 */
export default interface IUserSessionCacheRepository {
    /**
     * Stores a user session in the cache
     * @param userId - The ID of the user
     * @param userSession - The user session data with authentication info
     * @param ttlSeconds - Time to live in seconds (optional)
     * @returns Promise resolving to true if successful, false otherwise
     */
    storeUserSession(
        userId: string,
        userSession: UserSession,
        ttlSeconds?: number
    ): Promise<boolean>;

    /**
     * Retrieves a user session from the cache
     * @param userId - The ID of the user
     * @returns Promise resolving to the user session or null if not found
     */
    getUserSession(userId: string): Promise<UserSession | null>;

    /**
     * Removes a user session from the cache
     * @param userId - The ID of the user
     * @returns Promise resolving to true if successful, false otherwise
     */
    removeUserSession(userId: string): Promise<boolean>;
}
