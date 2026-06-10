import { sendApiResponse } from "@/utils/backend/apiUtil";
import { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "./middleware/authorization";
import { IUser } from "@repo/interfaces";
import { createPublicClient, http, parseAbi } from "viem";
import { ronin } from "viem/chains";
import { SiweMessage } from "siwe";

// https://www.coingecko.com/en/nft/cyberkongz-vx-ronin
const CYBERKONGZ_CONTRACT_ADDRESS =
    "0x241a81fc0d6692707dad2b5025a3a7cf2cf25acf";
// const A_CYBERKONGZ_OWNER = "0x37a5bc9899d1cbc64e5ebefd3516fea21398523d";

/**
 * NextJS API Route Handler - GET Request only
 * @param req: request data via API Route
 * @param res: response data via API Route
 */
async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "POST") {
        sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
        });
        return;
    }

    try {
        const message = req.body.message as string;
        const signature = req.body.signature as `0x${string}`;
        console.log("Verifying Ronin Skip The Line");
        const address = await validateSignature(message, signature);
        if (!address) {
            console.log("Invalid signature in Ronin Skip The Line");
            sendApiResponse(res, {
                success: false,
                err: "Invalid signature",
            });
            return;
        }

        console.log(
            `Recovered address ${address} from signature in Ronin Skip The Line`
        );
        // TODO: might want to use a different RPC url w/ an API key for better rate limits
        const roninClient = createPublicClient({
            chain: ronin,
            transport: http(),
        });
        const balanceOfRes = await roninClient.readContract({
            address: CYBERKONGZ_CONTRACT_ADDRESS,
            abi: parseAbi([
                "function balanceOf(address) view returns (uint256)",
            ]),
            functionName: "balanceOf",
            args: [address],
            // args: [A_CYBERKONGZ_OWNER],
        });
        const amountOwned = Number(balanceOfRes);
        console.log(
            `${address} owns ${amountOwned} NFTs on ronin for contract ${CYBERKONGZ_CONTRACT_ADDRESS}`
        );
        const canSkip = amountOwned > 0;
        sendApiResponse(res, {
            success: true,
            data: {
                canSkip,
            },
        });
    } catch (e: any) {
        console.error("Error unable to verify ronin skip the line", e);
        sendApiResponse(res, {
            success: false,
            err: `Error unable to verify ronin skip the line ${e.message}`,
        });
    }
}

// Returns the recovered address if the signature is valid, otherwise null
async function validateSignature(
    message: string,
    signature: string
): Promise<`0x${string}` | null> {
    try {
        const msgToVerify = new SiweMessage(JSON.parse(message));
        // this throws an error if the signature is invalid
        const siweMessage = await msgToVerify.validate(signature);
        return siweMessage.address as `0x${string}`;
    } catch (e) {
        return null;
    }
}

export default authorize(handler);
