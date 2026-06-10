import connectToDb from "@/db/connectToDb";
import { NextApiRequest, NextApiResponse } from "next";
import { updateOneUserDB, UserDoc } from "@repo/schemas";
import { authorize } from "../../middleware/authorization";
import { searchAllProviderIdQuery } from "@/utils/backend/accountsBackendUtil";

/**
 * Update email related preferences for a user
 * @param req - request object
 * @param res - response object
 */
async function email(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "PATCH") {
        await connectToDb();

        try {
            const { userDBProviderId, sendNotifications } = req.body;

            if (!userDBProviderId) {
                return res
                    .status(400)
                    .json({ error: `User Provider ID is required` });
            }

            const mongoQuery = searchAllProviderIdQuery(userDBProviderId);

            const user: UserDoc | null = await updateOneUserDB(mongoQuery, {
                "preferences.sendNotifications": sendNotifications,
            });

            console.log(
                `user _id: ${userDBProviderId} has updated email preferences on sendNotifications to ${sendNotifications}`
            );

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            res.status(200).json({
                message: "Email preferences updated",
                user,
            });
        } catch (error) {
            console.error("Update email preferences error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    } else {
        res.setHeader("Allow", ["PATCH"]);
        res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
}

export default authorize(email);
