import connectToDb from "@/db/connectToDb";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "./middleware/authorization";
import { IUser, WildcardApiResponse } from "@repo/interfaces";
import { handleFetchExternalStreams } from "@/utils/backend/externalStreamUtil";

async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "GET") {
        sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
        });
        return;
    }

    try {
        await connectToDb();
        console.log(`Fetching all external streams`);
        const war: WildcardApiResponse = await handleFetchExternalStreams();
        sendApiResponse(res, war);
    } catch (e: any) {
        console.error("Error unable to fetch external stream", e);
        sendApiResponse(res, {
            success: false,
            err: `Error unable to fetch external streams ${e.message}`,
        });
    }
}

export default authorize(handler);
