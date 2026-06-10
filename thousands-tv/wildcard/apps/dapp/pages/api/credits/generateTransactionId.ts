import { v4 as uuidv4 } from "uuid"; // Import the UUID library
import { NextApiRequest, NextApiResponse } from "next";

type RequestResponse = {
    success: boolean;
    message: string;
    data?: { transactionId: string };
    error?: string;
};

/**
 * Generate and return a unique UUID for the transaction.
 * @param req
 * @param res
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<RequestResponse>
) {
    if (req.method !== "GET") {
        return res.status(405).json({
            success: false,
            message: `Method ${req.method} Not Allowed`,
            error: "",
        });
    }

    try {
        const transactionId = uuidv4();

        return res.status(200).json({
            success: true,
            message: "Transaction reference generated successfully",
            data: { transactionId },
        });
    } catch (error: any) {
        console.error("Error generating transaction reference:", error);
        return res.status(500).json({
            success: false,
            message: "Error generating transaction reference",
            error: error.message,
        });
    }
}
