import { NextApiRequest, NextApiResponse } from "next";
import connectToDb from "@/db/connectToDb";
import { updateOneUserDB } from "@repo/schemas";
import { IUser, LinkedFarcaster, WildcardApiResponse } from "@repo/interfaces";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { authorize } from "./middleware/authorization";
import { UpdateQuery } from "mongoose";
import { queryForAssociatedWallets } from "@/utils/userUtil";
import { DOMAIN_FOR_FARCASTER } from "@/constants/constants";
import { getFarcasterAppClient } from "@/db/connectToFarcasterApp";

async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "POST") {
        sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
        });
        return;
    }

    return res.status(404).json({ message: "Not Found" });
}

async function linkFarcaster(
    req: NextApiRequest,
    user: IUser
): Promise<WildcardApiResponse> {
    const { fid, username, message, signature, nonce } = req.body;
    const fidStr = fid.toString();

    const userAddress = user?.walletProvider?.address || "";
    console.log(
        `Linking Farcaster social for user at address '${userAddress}' with username: ${username}, farcaster id ${fid}`
    );

    const isValidFarcasterBodyWar = await isFarcasterBodyValid(
        fidStr,
        username,
        message,
        signature,
        nonce
    );
    if (!isValidFarcasterBodyWar.success) {
        return isValidFarcasterBodyWar;
    }

    let linkedFarcaster: LinkedFarcaster = {
        fid: fidStr,
        username,
        message,
        signature,
        nonce,
    };

    // save the social info in the DB
    const update: UpdateQuery<IUser> = {
        "wildfile.farcaster": linkedFarcaster,
    };
    const userQuery = queryForAssociatedWallets(userAddress);
    const updatedUser = await updateOneUserDB(userQuery, update);

    const successMsg = `Successfully linked farcaster user '${username}' to wallet address '${userAddress}'`;
    console.log(successMsg);
    return {
        success: true,
        data: { updatedUser },
    };
}

async function isFarcasterBodyValid(
    fidStr: string,
    username: string,
    message: string,
    signature: `0x${string}`,
    nonce: string
): Promise<WildcardApiResponse> {
    // validation: check all link social fields (for logging purposes)
    const validateFarcasterBody = [
        { field: fidStr, name: "fid" },
        { field: username, name: "username" },
        { field: message, name: "message" },
        { field: signature, name: "signature" },
        { field: nonce, name: "nonce" },
    ];

    for (const { field, name } of validateFarcasterBody) {
        if (!field) {
            return {
                success: false,
                err: `Invalid link farcaster body: Missing ${name}`,
            };
        }
    }

    //Verify the signed message from farcaster
    const appClient = getFarcasterAppClient();
    const {
        data,
        success,
        fid: returnedFid,
    } = await appClient.verifySignInMessage({
        nonce,
        domain: DOMAIN_FOR_FARCASTER,
        message,
        signature,
    });
    const returnedFidStr = returnedFid.toString();

    const expirationTime = data?.expirationTime;
    if (expirationTime) {
        const expireDate = new Date(expirationTime);
        const expireTimeMs = expireDate.getTime();
        const currTimeMs = new Date().getTime();
        if (currTimeMs > expireTimeMs) {
            const err = `Not linking farcaster. The signed message has expired at ${expirationTime}`;
            console.log(err);
            return {
                success: false,
                err,
            };
        }
    }
    if (!success || returnedFidStr !== fidStr) {
        const err = `Not linking farcaster. The signed message with nonce and domain are not valid`;
        console.log(err);
        return {
            success: false,
            err,
        };
    }
    return { success: true };
}

export default authorize(handler);
