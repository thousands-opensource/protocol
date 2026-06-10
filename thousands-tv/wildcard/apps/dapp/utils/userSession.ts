import { Session } from "next-auth";

/**
 * Retrieves the user object from the session.
 *
 * @param {Session | any} session - The session object which may contain a user.
 * @returns {any | null} The user object if it exists in the session, otherwise null.
 */
export const getUserSessionObj = (session: Session | any): any | null => {
    if (!session?.user) {
        console.error("No user session found");
        return null;
    }
    const user = session?.user as any;
    return user;
};
