import { diContainer } from "@/inversify.config";
import IUserSessionCacheRepository from "@/repositories/interfaces/IUserSessionCacheRepository";
import {
    SessionAuthenticationResponse,
    UserSession,
    IUser,
} from "@repo/interfaces";
import { Types } from "mongoose";

// Default TTL for fraud data in cache (4 hours) - allows for frequent updates during fraud checks
export const FRAUD_DATA_REFRESH_INTERVAL_MS = 4 * 60 * 60 * 1000;

// Default TTL for user sessions in cache (24 hours)
const USER_SESSION_TTL = 60 * 60 * 24;

/**
 * Get the user session cache repository from the DI container
 * @returns The user session cache repository instance
 */
function getUserSessionRepository(): IUserSessionCacheRepository {
    return diContainer.get<IUserSessionCacheRepository>(
        "IUserSessionCacheRepository"
    );
}

/**
 * Ensures we use consistent keys for user session cache entries
 * @param userId - The user ID
 * @returns Formatted cache key
 */
export function getUserSessionKey(userId: string | Types.ObjectId): string {
    return `user-session:${userId.toString()}`;
}

/**
 * Stores a user session in the cache
 * @param userId - The ID of the user (MongoDB _id is preferred)
 * @param userSession - The user session data
 * @param ttlSeconds - Optional TTL in seconds
 * @returns Promise resolving to true if successful
 */
export async function storeUserSession(
    userId: string | Types.ObjectId,
    userSession: UserSession,
    ttlSeconds: number = USER_SESSION_TTL
): Promise<boolean> {
    try {
        const repository = getUserSessionRepository();
        const userIdStr = userId.toString();

        console.log(`[UserSession] Storing session for user: ${userIdStr}`);

        return await repository.storeUserSession(
            userIdStr,
            userSession,
            ttlSeconds
        );
    } catch (error) {
        console.error("[UserSession] Failed to store user session:", error);
        return false;
    }
}

/**
 * Creates and stores a user session
 * @param userSession - The complete user session object
 * @param ttlSeconds - Optional TTL in seconds
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function createAndStoreUserSession(
    userSession: UserSession,
    ttlSeconds?: number
): Promise<boolean> {
    // Check if the session has a valid user object with an _id
    if (!userSession || !userSession.user || !userSession.user._id) {
        console.error(
            "[UserSession] Cannot store session: Invalid user session object or missing user._id"
        );
        return false;
    }

    try {
        // Use the user's _id as the key for storing the session
        return await storeUserSession(
            userSession.user._id,
            userSession,
            ttlSeconds
        );
    } catch (error) {
        console.error("[UserSession] Failed to store user session:", error);
        return false;
    }
}

/**
 * Retrieves a user session from the cache
 * @param userId - The ID of the user
 * @returns Promise resolving to the user session or null if not found
 */
export async function getUserSession(
    userId: string | Types.ObjectId
): Promise<UserSession | null> {
    try {
        const repository = getUserSessionRepository();
        const userIdStr = userId.toString();

        console.log(`[UserSession] Retrieving session for user: ${userIdStr}`);

        return await repository.getUserSession(userIdStr);
    } catch (error) {
        console.error("[UserSession] Failed to retrieve user session:", error);
        return null;
    }
}

/**
 * Updates the authentication data for a user session
 *
 * @param userId - The ID of the user
 * @param authData - The authentication data
 * @param allow - Whether the user is allowed
 * @returns Promise resolving to true if successful
 */
export async function updateUserSessionAuthData(
    userId: string | Types.ObjectId,
    authData: SessionAuthenticationResponse,
    allow: boolean
): Promise<boolean> {
    try {
        const userIdStr = userId.toString();
        console.log(`[UserSession] Updating auth data for user: ${userIdStr}`);

        // First get the existing session
        const existingSession = await getUserSession(userIdStr);

        if (!existingSession) {
            console.error(
                `[UserSession] Cannot update auth data: No session found for user ${userIdStr}`
            );
            return false;
        }

        // Update with new auth data
        const updatedSession: UserSession = {
            user: existingSession.user, // Keep the existing user data
            antiFraudDetection: authData,
            allow: allow,
            timestamp: Date.now(),
        };

        // Store the updated session
        return await storeUserSession(userIdStr, updatedSession);
    } catch (error) {
        console.error(
            "[UserSession] Failed to update session auth data:",
            error
        );
        return false;
    }
}

/**
 * Removes a user session from the cache
 * @param userId - The ID of the user
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function removeUserSession(
    userId: string | Types.ObjectId
): Promise<boolean> {
    try {
        const repository = getUserSessionRepository();
        const userIdStr = userId.toString();

        console.log(`[UserSession] Removing session for user: ${userIdStr}`);
        return await repository.removeUserSession(userIdStr);
    } catch (error) {
        console.error("[UserSession] Failed to remove user session:", error);
        return false;
    }
}

/**
 * Creates a UserSession object from an IUser object
 *
 * @param user - The user object
 * @returns A UserSession object with default fraud detection values
 */
export function createUserSession(user: IUser): UserSession {
    // Create a plain object copy of the user to avoid Mongoose document issues
    const userDBObject = toPlainObject(user);

    return {
        user: userDBObject,
        antiFraudDetection: null,
        allow: true,
        timestamp: Date.now(),
    };
}

/**
 * Safely converts any object to a plain JavaScript object.
 * If the object is a Mongoose document with toObject(), it will use that.
 * Otherwise, it will use JSON serialization/deserialization.
 *
 * @param obj - The object to convert
 * @returns A clean plain JavaScript object
 */
export function toPlainObject<T>(obj: T): T {
    if (!obj) return obj;

    // Check if the object has a toObject method (Mongoose document)
    if (obj && typeof (obj as any).toObject === "function") {
        return (obj as any).toObject();
    }

    // Otherwise use JSON serialization/deserialization to get a clean object
    return JSON.parse(JSON.stringify(obj));
}
