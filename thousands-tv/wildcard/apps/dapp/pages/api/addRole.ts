import connectToDb from "@/db/connectToDb";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "./middleware/authorization";
import { IUser, UserRole, WildcardApiResponse } from "@repo/interfaces";
import { addRole } from "@/utils/backend/accountsBackendUtil";

async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "POST") {
        sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
        });
        return;
    }

    try {
        await connectToDb();
        const war: WildcardApiResponse = await handleAddRole(req, user);
        sendApiResponse(res, war);
    } catch (e: any) {
        console.error("Error unable add role", e);
        sendApiResponse(res, {
            success: false,
            err: `Error unable add role ${e.message}`,
        });
    }
}

async function handleAddRole(
    req: NextApiRequest,
    user: IUser
): Promise<WildcardApiResponse> {
    const role: UserRole = req.body.role;
    if (!role) {
        const err = "Invalid role";
        console.error(err);
        return {
            success: false,
            err,
        };
    }

    return await addRole(user, role);
}

export default authorize(handler);
