import { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "./middleware/authorization";
import { IUser } from "@repo/interfaces";

async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    // Middleware will handle authorization
    // just need to return a success api response here to send back if middleware checks pass

    res.status(200).json({
        success: true,
        message: "Authorized",
    });
}

export default authorize(handler);
