import { NextApiRequest, NextApiResponse } from "next";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { MAX_ADDITIONAL_WALLETS } from "@/constants/constants";
import connectToDb from "@/db/connectToDb";
import { verifySignedMessage } from "@/utils/util";
import { queryForAssociatedWallets } from "@/utils/userUtil";
import { UpdateQuery } from "mongoose";
import {
    ActivityLog,
    ActivityLogTypeEnum,
    IUser,
    WildcardApiResponse,
} from "@repo/interfaces";
import { findOneUserByQueryAuthorized, updateOneUserDB } from "@repo/schemas";
import { authorize } from "@/pages/api/middleware/authorization";
import { createActivityLogEntry } from "@/utils/backend/activityLogUtil";
import { ethers } from "ethers";
import { BACKEND_PROVIDER } from "@/utils/backend/backendContracts";
import { removeUserSession } from "@/utils/backend/userSessionBackendUtil";

// DO NOT use authorize in this api because the user is not logged in when calling (only primary cookies are set)
async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
    userDB: IUser
) {
    if (req.method !== "POST") {
        sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
        });
        return;
    }

    try {
        await connectToDb();
        const war: WildcardApiResponse = await linkAdditionalWallet(
            req,
            userDB
        );
        sendApiResponse(res, war);
    } catch (e: any) {
        console.error("Error linking additional wallet in ", e);
        sendApiResponse(res, {
            success: false,
            err: `Error linking additional wallet in ${e.message}`,
        });
    }
}

/**
 * Handles the linking additional wallet API call
 * @param req - The request object
 * @param user - The user object
 * @returns - The result of the API call
 */
async function linkAdditionalWallet(
    req: NextApiRequest,
    userDB: IUser
): Promise<WildcardApiResponse> {
    const { address, message, signature } = req.body;

    const code = await BACKEND_PROVIDER.getCode(address);
    if (code !== "0x" && code !== "0x0") {
        return {
            success: false,
            err: `The address provided: ${address} is a smart contract. It must be an EOA.`,
        } as WildcardApiResponse;
    }

    const validationResponse = await validateAdditionalWalletForLinking(
        userDB,
        message,
        signature,
        address
    );

    if (!validationResponse.success) {
        return {
            success: false,
            err: validationResponse.err,
        } as WildcardApiResponse;
    }

    // Update the user's additional wallets in the DB & insert linked wallet wildevent
    const update: UpdateQuery<IUser> = {
        $push: { "walletProvider.additionalWallets": address },
    };
    const updatedUser: IUser = await updateOneUserDB(
        { _id: userDB._id },
        update
    );

    // Update the user's activity log
    const activityLog: ActivityLog | undefined = await createActivityLogEntry(
        userDB._id?.toString(),
        ActivityLogTypeEnum.LINK_WALLET,
        JSON.stringify({
            linkedAddress: address,
        })
    );

    if (userDB._id) {
        // Invalidate User Session Cache
        console.log(`Invalidating user session for user [${userDB._id}]`);
        await removeUserSession(userDB._id.toString());
    }

    const msg = `Successfully linked additional wallet ${address} for user [${updatedUser._id}]`;
    console.log(msg);
    return { success: true, data: { updatedUser, activityLog } };
}

/**
 * Validates the additional wallet for linking by checking if the wallet is already linked, if the user has reached the maximum number of wallets, and if the wallet is already linked to another Thousands account
 * @param address - The address of the wallet to link
 * @param primarySigCookie - The signature of the primary wallet
 * @param primaryAddressCookie - The address of the primary wallet
 * @param reformatedMsgCookie - The message of the primary wallet
 * @returns - A success boolean, the user object, and an error message if the validation fails
 */
async function validateAdditionalWalletForLinking(
    userDB: IUser,
    message: string,
    signature: string,
    address: string
): Promise<{ success: boolean; user?: IUser; err?: string }> {
    const sigVerification = await verifySignedMessage(
        message,
        signature,
        address
    );

    if (!sigVerification) {
        return {
            success: false,
            err: "Invalid signature for primary cookies.",
        };
    }

    if (!userDB.walletProvider?.address) {
        const err = `User does not have a primary wallet linked`;
        console.log(err);
        return {
            success: false,
            err,
        };
    }

    console.log(
        `User [${userDB._id}] is attempting to link an additional Wallet. Primary address: ${userDB.walletProvider?.address}`
    );

    const isWalletAlreadyLinked =
        userDB.walletProvider?.address === address ||
        userDB.walletProvider?.additionalWallets?.some(
            (additionalAddress) =>
                additionalAddress && additionalAddress === address
        );

    if (isWalletAlreadyLinked) {
        const err = `You have already linked wallet ${address} to your Thousands account`;
        console.log(err);
        return {
            success: false,
            err,
        };
    }

    const numWalletsLinked =
        userDB.walletProvider?.additionalWallets?.length || 0;
    if (numWalletsLinked >= MAX_ADDITIONAL_WALLETS) {
        const err = `You have already linked the maximum amount of wallets to your Thousands account`;
        console.log(err);
        return {
            success: false,
            err,
        };
    }

    const generalUserQuery = queryForAssociatedWallets(address);
    let generalUser = await findOneUserByQueryAuthorized(generalUserQuery);
    if (generalUser && generalUser.walletProvider?.address) {
        const err = `${address} is already linked to another Thousands account`;
        console.log(err);
        return {
            success: false,
            err,
        };
    }

    return { success: true, user: userDB };
}

export default authorize(handler);
