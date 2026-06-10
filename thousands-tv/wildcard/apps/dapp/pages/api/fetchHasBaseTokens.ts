import { NextApiRequest, NextApiResponse } from "next";
import { sendApiResponse, sendApiResponseWithStatusCode } from "@/utils/backend/apiUtil";
import { isWolvesDaoHolder as checkIsWolvesDaoHolder } from "@/utils/backend/wolvesDaoUtil";
import { authorize } from "./middleware/authorization";
import { fetchNftsForOwnerEth, getBaseErc20TokenBalances } from "@/utils/backend/alchemyUtil";
import { IUser } from "@repo/interfaces";
import { BigNumber } from "ethers";

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

    const minTokensHeld = BigNumber.from("1200000000000000000000"); //The required number of tokens that needs to be held to get the bonus
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
        let isBaseTokenHolder = false;

        // This is a map of contract address to token balance because we need to sum up the token balances for each wallet address they have associated
        const erc20TokenBalances: {
            [address: string]: BigInt;
        } = {};

        for (const address of walletAddresses) {
            if (address == null)
            {
                continue;
            }

            const baseAddressToCheck = ["0x919e43a2cce006710090e64bde9e01b38fd7f32f"];  //Agent YP Bonus (12,000 Tokens)

            const ownedBaseTokensResponse = await getBaseErc20TokenBalances(
                address,
                baseAddressToCheck 
            );

            let totalTokens: BigNumber = BigNumber.from(0);
            if (ownedBaseTokensResponse && ownedBaseTokensResponse.length > 0)
            {
                // Iterate through the ERC20 token balances for the current wallet address
                for (const tokenBalance of ownedBaseTokensResponse) {
                    const tokenBalanceBigNumber: BigNumber = BigNumber.from(tokenBalance.tokenBalance);

                    totalTokens = totalTokens.add(tokenBalanceBigNumber);

                    if (
                        totalTokens >= minTokensHeld
                    ) {
                        // If the user has enough tokens held for any of the ERC20 token-gated contracts, they get the credit purchase bonus
                        console.info(
                            `User [${user._id}] receives the credits purchase bonus with ${totalTokens} tokens held for contract address: ${baseAddressToCheck}`
                        );
                        isBaseTokenHolder = true;
                        break;
                    }                    
                }
            }  
            if (isBaseTokenHolder)                       
                break;
        }

        return sendApiResponse(res, {
            success: true,
            data: {
                isBaseTokenHolder: isBaseTokenHolder,
            },
        })
    }

    return sendApiResponse(res, {
        success: false,
        data: 'No wallet address provided',
    });

}

export default authorize(handler);
