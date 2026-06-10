import { authorize } from "./authorization";
import { UserRole } from "@repo/interfaces";

/**
 * Middleware to verify the access token and authorize only admin users.
 * @param handler
 */
export const authorizeAdmin = (handler: any) =>
    authorize(handler, [UserRole.ADMIN]);

export default authorizeAdmin;
