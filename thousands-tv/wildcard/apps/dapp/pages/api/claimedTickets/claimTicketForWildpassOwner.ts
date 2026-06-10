import { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "../middleware/authorization";
import {
    AccessCodeIntent,
    AccessCodeType,
    IUser,
    TicketTierType,
} from "@repo/interfaces";
import {
    claimTicketAndRedirectToStreamPage,
    createAccessCode,
} from "@/utils/backend/accountsBackendUtil";
import { isWalletAddressProvider } from "@/utils/accountsUtil";

/**
 * API endpoint to check for Wildpass ownership and claim a ticket
 * @dev - Endpoint checks for Wildpass ownership, generates an access code, and claims a ticket => redirects to the stage
 * @param req
 * @param res
 * @param user
 * @returns
 */
async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "POST") {
        return res
            .status(405)
            .json({ message: `Method ${req.method} Not Allowed` });
    }

    try {
        const { stageId, seriesId, eventId, serverCode } = req.body;

        // Get wallet address from the user object (assumes it's available)
        const walletAddress = user.walletProvider?.address;

        if (!walletAddress) {
            return res
                .status(400)
                .json({ message: "Wallet address is required." });
        }

        if (!user._id) {
            return res.status(400).json({ message: "User ID is required." });
        }

        if (!stageId || !seriesId) {
            return res
                .status(400)
                .json({ message: "Stage ID and series ID are required." });
        }

        if (!eventId) {
            return res.status(400).json({ message: "Event ID is required." });
        }

        if (!serverCode) {
            return res
                .status(400)
                .json({ message: `Server code is required.` });
        }

        // Check the Wildpass balance
        const isOwner = await isWalletAddressProvider(walletAddress);

        if (!isOwner) {
            const errMsg = `Wallet address ${walletAddress} is not a Wildpass owner at timestamp: ${new Date().toISOString()}`;
            console.log(errMsg);
            return res.status(401).json({
                message: `It appears you do not have a Wildpass associated with your logged in wallet address.`,
            });
        }

        const accessCodeData = {
            organizationId: null,
            codeType: AccessCodeType.SINGLE_USE,
            maxQuantity: 1,
            seriesId: seriesId,
            intent: AccessCodeIntent.TICKET,
            tier: TicketTierType.GENERAL_ADMISSION,
        };

        const accessCode: string | null = await createAccessCode(
            accessCodeData
        );

        if (!accessCode) {
            return res.status(500).json({
                error: `Failed to generate access code for series ID: ${seriesId} for user ID: ${user._id}`,
                message: "Failed to generate access code",
            });
        }

        // Claim the ticket using the access code
        const { redirect } = await claimTicketAndRedirectToStreamPage(
            user._id?.toString(),
            eventId,
            accessCode,
            stageId,
            serverCode
        );

        if (!redirect) {
            return res.status(500).json({
                error: `Failed to claim ticket for user ID: ${user._id} and event ID: ${eventId}`,
                message: "Failed to claim ticket",
            });
        }

        // Return access code, and redirect URL upon a successful claim
        res.status(200).json({
            accessCode,
            stageUrl: redirect.destination,
            message: "Access code generated and ticket claimed successfully.",
        });
    } catch (error: any) {
        console.error(
            "Error processing Wildpass check and ticket claim:",
            error
        );
        res.status(500).json({
            error: `Failed to process Wildpass check and ticket claim: ${error.message}`,
            message: error?.message,
        });
    }
}

export default authorize(handler);
