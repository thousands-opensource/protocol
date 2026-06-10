import { NextApiRequest, NextApiResponse } from "next";
import connectToDb from "@/db/connectToDb";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { updateOneUserDB } from "@repo/schemas";
import { authorize } from "./middleware/authorization";
import { FilterQuery } from "mongoose";
import { getUserPfp } from "@/utils/userUtil";
import { emptyPfp } from "@/constants/constants";
import {
    doesListOfAddressesOwnedNft,
    fetchSwagWildpassesForUser,
} from "@/utils/backend/alchemyUtil";
import {
    ActivityLogTypeEnum,
    IUser,
    WildcardApiResponse,
} from "@repo/interfaces";
import { createActivityLogEntry } from "@/utils/backend/activityLogUtil";
import { updatePfp } from "@/utils/backend/accountsBackendUtil";
import { removeUserSession } from "@/utils/backend/userSessionBackendUtil";

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
        const war: WildcardApiResponse = await unlinkWallet(req, user);
        sendApiResponse(res, war);
    } catch (e: any) {
        console.error("Error unlinking wallet", e);
        sendApiResponse(res, {
            success: false,
            err: `Error unlinking wallet ${e.message}`,
        });
    }
}

/**
 * Handles the unlinking of a wallet from a user's account
 * @param req - The request object
 * @param user - The user object
 * @returns - The result of the API call
 */
async function unlinkWallet(
    req: NextApiRequest,
    user: IUser
): Promise<WildcardApiResponse> {
    const { addressToRemove } = req.body;
    const walletAddress = user.walletProvider?.address || "";
    const query: FilterQuery<IUser> = {
        "walletProvider.address": walletAddress,
    };

    console.log(
        `User [${user._id}] is attempting to unlink wallet ${addressToRemove}`
    );

    // Ensure the wallet we are trying to remove is actually linked to that user
    const validationResponse = await validateWalletForUnlinking(
        user,
        addressToRemove
    );
    if (!validationResponse.success) {
        return validationResponse;
    }

    // Update user's additional wallets in the DB
    const update = {
        $pull: { "walletProvider.additionalWallets": addressToRemove },
    };
    let updatedUser = await updateOneUserDB(query, update);

    // Reset PFP if associated with the unlinked wallet address
    const pfp = getUserPfp(updatedUser);
    if (pfp !== emptyPfp) {
        const isOwnedByUnlinkedWallet = await doesListOfAddressesOwnedNft(
            [addressToRemove],
            pfp.contractAddress,
            pfp.tokenId
        );
        if (isOwnedByUnlinkedWallet) {
            const updatePfpResponse = await updatePfp(emptyPfp, updatedUser);
            if (!updatePfpResponse.success) {
                return {
                    success: false,
                    err: updatePfpResponse.err,
                };
            }
            updatedUser = updatePfpResponse.data.updatedUser;
        }
    }

    // Fetch user's swag pins, wildpasses, pfps now that they have a new list of addresses
    const { swagPins, wildpasses } = await fetchSwagWildpassesForUser(
        updatedUser
    );

    // Update the user's activity log
    await createActivityLogEntry(
        user?._id?.toString(),
        ActivityLogTypeEnum.UNLINK_WALLET,
        JSON.stringify({
            unlinkedAddress: addressToRemove,
        })
    );

    if (user._id) {
        // Invalidate User Session Cache
        console.log(`Invalidating user session for user [${user._id}]`);
        await removeUserSession(user._id.toString());
    }

    console.log(
        `Successfully unlinked additional wallet ${addressToRemove} for User ${updatedUser._id}.`
    );

    return {
        success: true,
        data: { updatedUser, swagPins, wildpasses },
    };
}

/**
 * Validates the wallet for unlinking by checking if the wallet is linked to the user
 * @param user - The user object
 * @param addressToRemove - The address of the wallet to remove
 * @returns - A success boolean and an error message if the validation fails
 */
async function validateWalletForUnlinking(
    user: IUser,
    addressToRemove: string
): Promise<WildcardApiResponse> {
    const isWalletLinked = user.walletProvider?.additionalWallets?.find(
        (addr) => addressToRemove === addr
    );
    if (!isWalletLinked) {
        const err = `${addressToRemove} is not linked to your Thousands account`;
        console.error(err);
        return {
            success: false,
            err,
        };
    }

    return { success: true };
}

export default authorize(handler);
