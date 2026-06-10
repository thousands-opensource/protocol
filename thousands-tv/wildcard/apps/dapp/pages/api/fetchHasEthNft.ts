import { NextApiRequest, NextApiResponse } from "next";
import { sendApiResponse, sendApiResponseWithStatusCode } from "@/utils/backend/apiUtil";
import { authorize } from "./middleware/authorization";
import { fetchNftsForOwnerEth } from "@/utils/backend/alchemyUtil";
import { IUser } from "@repo/interfaces";

/**
 * NextJS API Route Handler - GET Request only
 * @param req: request data via API Route
 * @param res: response data via API Route
 * @param user - The authorized user object.
 */
async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "GET") {
        sendApiResponseWithStatusCode(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
        });
        return;
    }

    const walletProvider = user?.walletProvider;

    if (walletProvider == null)
    {
        return sendApiResponse(res, {
            success: false,
            data: 'Invalid walletProvider',
        });    
    }

    const walletAddresses = [
        walletProvider.address,
        ...(walletProvider.additionalWallets || []),
    ];

    if (walletAddresses) {
        let isEthNftHolder = false;

        for (const address of walletAddresses) {
            if (address == null)
            {
                continue;
            }

            const ownedEthNftsResp = await fetchNftsForOwnerEth(
                address,
                ["0x548c407d35cdd3c812458d9ef6d135963f9f7ece"]
            );

            if (ownedEthNftsResp && ownedEthNftsResp.ownedNfts.length > 0)
            {
                isEthNftHolder = true;
                break;
            }                         
        }

        return sendApiResponse(res, {
            success: true,
            data: {
                isEthNftHolder,
            },
        })
    }

    return sendApiResponse(res, {
        success: false,
        data: 'No wallet address provided',
    });

}

export default authorize(handler);
