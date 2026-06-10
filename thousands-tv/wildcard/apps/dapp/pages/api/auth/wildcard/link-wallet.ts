import { NextApiRequest, NextApiResponse } from "next";
import connectToDb from "@/db/connectToDb";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { AccountProviderType } from "@repo/interfaces";
import { linkWeb3AccountToUser, WildcardSessionTokenParams } from "./token";

const client = createPublicClient({
    chain: mainnet,
    transport: http(),
});

export interface WildcardWeb3SessionTokenParams {
    accountProviderType: AccountProviderType;
    userDBId: string;
    message: string;
    signature: string;
    address: string;
}

async function linkWeb3Wallet(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res
            .status(405)
            .json({ message: `Method ${req.method} Not Allowed` });
    }

    /// Validate session logic, get _id and accountProvider, validate user, retrieve their role an provide the appropriate role based token
    const { wildcardSessionTokenParams } = req.body;

    const { accountProviderType } = wildcardSessionTokenParams as
        | WildcardSessionTokenParams
        | WildcardWeb3SessionTokenParams;

    try {
        const { message, signature, address, userDBId } =
            wildcardSessionTokenParams as WildcardWeb3SessionTokenParams;

        if (!address) {
            return res.status(400).json({
                message: "Invalid address during signature verification",
            });
        }

        if (!message) {
            return res.status(400).json({
                message: "Invalid message during signature verification",
            });
        }

        if (!signature) {
            return res.status(400).json({
                message: "Invalid signature during signature verification",
            });
        }

        const sigVerification = await verifySignedMessage(
            message,
            signature,
            address
        );

        if (!sigVerification) {
            return res.status(401).json({
                success: false,
                data: null,
                message: "Invalid signature",
            });
        }

        await connectToDb();

        const linkAccountResponse = await linkWeb3AccountToUser(
            address,
            userDBId
        );

        return res.status(200).json(linkAccountResponse);
    } catch (error: any) {
        console.log(
            "Error validating signature and creating user token:",
            error.message
        );
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export default linkWeb3Wallet;

/**
Verify the signature of a message based on user signed message
@param message - The message to verify.
@param signature - The signature to verify.
@param address - The expected address of the signer.
@returns true if the signature is valid, false otherwise.
*/
export const verifySignedMessage = async (
    message: any,
    signature: any,
    address: any
) => {
    try {
        const valid = await client.verifyMessage({
            address: address,
            message: message,
            signature,
        });
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
};
