import connectToDb from "@/db/connectToDb";
import { ActivityItem, WildcardApiResponse } from "@repo/interfaces";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { NextApiRequest, NextApiResponse } from "next";
import { IUser } from "@repo/interfaces";
import { OwnedNft } from "alchemy-sdk";
import {
    fetchSwagPinsFromContract,
    fetchSwagWildpassesAndUserActivityForUser,
} from "@/utils/backend/alchemyUtil";
import { authorizeWithAuthToken } from "./middleware/authorizationWithAuthToken";
import { MAX_TOTAL_WILDPASSES } from "@/constants/constants";
import { findOneUserByQueryAuthorized } from "@repo/schemas";

/**
 * Fetch Fan Details Response
 */
interface FetchFanDetailsResponse {
    success: boolean;
    data?: FetchFanDetails;
    err?: string;
}

/**
 * Fetch Fan Details of a user
 */
interface FetchFanDetails {
    wildpasses: FetchFanDetailsNFT[];
    swagPins: FetchFanDetailsNFT[];
    wildeventsActivity: ActivityItem[];
    fanUniqueSwagPins: number;
    fanUniqueWildpasses: number;
    maxSwagPins: number;
    maxTotalWildpasses: number;
    walletAddress: string;
}

/**
 * Fetch Fan Details NFT
 */
interface FetchFanDetailsNFT {
    title: string;
    description: string;
    imageUrl: string | null;
    balance: number;
    contractAddress: string;
}

/**
 * NextJS API Route Handler - GET Request only
 * @param req: request data via API Route
 * @param res: response data via API Route
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
        });
        return;
    }

    try {
        const fanId = req.query.fanId as string;
        if (!fanId) {
            sendApiResponse(res, {
                success: false,
                err: "Missing fanId",
            });
            return;
        }
        await connectToDb();

        // note: fanId is the discordId of the user.
        // FanId notation is used for future platform support(i.e Twitch, YouTube)
        let iUser = await findOneUserByQueryAuthorized({ _id: fanId });
        if (!iUser) {
            const err = `User's fanId ${fanId} does not exist in db.`;
            console.log(err);
            return sendApiResponse(res, {
                success: false,
                err,
            });
        }

        const war: WildcardApiResponse = await getFanDetails(req, iUser);
        sendApiResponse(res, war);
    } catch (e: any) {
        const errMsg = `Error unable to fetch fan details`;
        console.error(errMsg, e);
        sendApiResponse(res, {
            success: false,
            err: `${errMsg} ${e.message}`,
        });
    }
}

/**
 * Parse NFTs to FetchFanDetailsNFT
 * @param nfts - NFTs to parse
 * @returns
 */
function parseFanDetailsNFT(nfts: OwnedNft[]): FetchFanDetailsNFT[] {
    return nfts.map((nft) => {
        return {
            title: nft.name || "",
            description: nft.description || "",
            imageUrl: nft?.image?.originalUrl || null,
            balance: Number(nft.balance),
            contractAddress: nft.contract.address,
        };
    });
}

/**
 * Filter wildevents user activity items by a max of 3
 * @dev - use a fixed number of 3 for in-game, to decouple from frontend
 * @param wildeventsUserActivity - user activity items from on-chain wildevents
 * @returns - filtered user activity items (Max of 3)
 */
function filterWildeventsLatestActivity(
    wildeventsUserActivity: ActivityItem[]
): ActivityItem[] {
    const latestWildeventsUserActivity: ActivityItem[] =
        wildeventsUserActivity.slice(
            0,
            Math.min(3, wildeventsUserActivity.length)
        );
    return latestWildeventsUserActivity;
}

/**
 * Get Fan Details for a user (wildpasses, swagPins, wildeventsActivity)
 * @param req - request data via API Routes
 * @param user - user to fetch fan details for
 */
async function getFanDetails(
    req: NextApiRequest,
    user: IUser
): Promise<WildcardApiResponse> {
    const { swagPins, wildpasses, userActivityWildevents } =
        await fetchSwagWildpassesAndUserActivityForUser(user);

    // parse for FanDetailsResponse
    const parsedSwagPins = parseFanDetailsNFT(swagPins);
    const parsedWildpasses = parseFanDetailsNFT(wildpasses);
    const filteredWildeventsUserActivity = filterWildeventsLatestActivity(
        userActivityWildevents
    );
    const swagPinsFromContract = await fetchSwagPinsFromContract();
    const totalUniqueSwagPins = swagPinsFromContract.length || 0;

    const fanDetailsResponse: FetchFanDetailsResponse = {
        success: true,
        data: {
            wildpasses: parsedWildpasses,
            swagPins: parsedSwagPins,
            wildeventsActivity: filteredWildeventsUserActivity,
            fanUniqueSwagPins: parsedSwagPins.length,
            fanUniqueWildpasses: parsedWildpasses.length,
            maxSwagPins: totalUniqueSwagPins,
            maxTotalWildpasses: MAX_TOTAL_WILDPASSES, // max total - 8 unique colors on-chain
            walletAddress: user?.walletProvider?.address || "",
        },
    };

    return fanDetailsResponse;
}

export default authorizeWithAuthToken(handler);
