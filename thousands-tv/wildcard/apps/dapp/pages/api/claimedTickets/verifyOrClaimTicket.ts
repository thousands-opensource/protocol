import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import { authorize } from "../middleware/authorization";
import { ClaimedTicketDoc } from "@repo/schemas";
import {
    AccessCodeIntent,
    AccessCodeType,
    ChainType,
    IClaimedTicket,
    IUser,
    TicketTierType,
    NftAccessDetails,
} from "@repo/interfaces";
import {
    doesAddressHaveWildpassTokens,
    isAddressWildpassHolder,
} from "@/utils/backend/wildpassUtil";
import {
    claimTicketViaAccessCode,
    createAccessCode,
} from "@/utils/backend/accountsBackendUtil";
import IClaimedTicketRepository from "@/repositories/interfaces/iClaimedTicketRepository";
import {
    fetchNftsForOwnerAvax,
    fetchNftsForOwnerBase,
    fetchNftsForOwnerEth,
    fetchNftsForOwnerPolygon,
    getEthErc20TokenBalances,
    hasSufficientStakedTokens as hasSufficientErc20StakedTokens,
} from "@/utils/backend/alchemyUtil";
import {
    getTokenGatedEthContractAddresses,
    getTokenGatedPolyContractAddresses,
    getEthWildpassContractAddress,
    getMinCreditsHeldToAllowEntryToAnEvent,
    getErc20TokenGatedEthContractAddresses,
    getMinTokensHeldToAllowEntryToAnEvent,
    getMinStakedErc20TokensHeldToAllowEntryToAnEvent,
    getErc20StakingContractAddresses,
    getTokenGatedBaseContractAddresses,
    getTokenGatedAvaxContractAddresses,
} from "@/utils/environmentUtil";
import { Types } from "mongoose";
import { BLACKLISTED_WILDPASS_TOKENIDS } from "@/constants";
import INftAccessRepository from "@/repositories/interfaces/iNftAccessRepository";
import { BackendApiResponse } from "@/types";
import ICreditBalanceRepository from "@/repositories/implementations/mongodb/ICreditBalanceRepository";

const ethFreeTicketsAddresses: string[] = getTokenGatedEthContractAddresses();
const erc20EthFreeTicketsAddresses: string[] =
    getErc20TokenGatedEthContractAddresses();
const minTokensHeldToAllowEntryToAnEvent =
    getMinTokensHeldToAllowEntryToAnEvent();

// Get staked-token-gated values
const erc20StakingContractAddresses: string[] =
    getErc20StakingContractAddresses();
const minStakedErc20TokensHeldToAllowEntryToAnEvent =
    getMinStakedErc20TokensHeldToAllowEntryToAnEvent();

const polygonFreeTicketsAddresses: string[] =
    getTokenGatedPolyContractAddresses();

const baseFreeTicketsAddresses: string[] =
    getTokenGatedBaseContractAddresses();

const avaxFreeTicketsAddresses: string[] =
    getTokenGatedAvaxContractAddresses();

const minCreditsRequired = getMinCreditsHeldToAllowEntryToAnEvent();

if (!ethFreeTicketsAddresses || ethFreeTicketsAddresses.length === 0) {
    console.warn(
        "Ethereum nft token-gated contract addresses not found or intentionally left empty. Ensure contracts are deployed or set the TOKEN_GATED_ETH_CONTRACT_ADDRESSES environment variable to the appropriate value."
    );
} else {
    console.log(
        `Using Ethereum nft token-gated contract addresses: ${ethFreeTicketsAddresses}`
    );
}

if (
    !erc20EthFreeTicketsAddresses ||
    erc20EthFreeTicketsAddresses.length === 0
) {
    console.warn(
        "Ethereum erc20 token-gated contract addresses not found or intentionally left empty. Ensure contracts are deployed and set the ERC20_TOKEN_GATED_ETH_CONTRACT_ADDRESSES environment variable to the appropriate value."
    );
} else {
    console.log(
        `Using Ethereum erc20 token-gated contract addresses: ${erc20EthFreeTicketsAddresses}`
    );
    // Since the erc20 token-gated contract addresses are not empty, we expect the min tokens held to allow entry to an event to be set
    if (minTokensHeldToAllowEntryToAnEvent === BigInt(-1)) {
        console.warn(
            "Minimum tokens held to allow entry to an event not found or intentionally left empty. This is not expected. Please check the MIN_TOKENS_HELD_TO_ALLOW_ENTRY_TO_AN_EVENT environment variable."
        );
    } else {
        console.log(
            `Using minimum tokens held to allow entry to an event: ${minTokensHeldToAllowEntryToAnEvent}`
        );
    }
}

if (!polygonFreeTicketsAddresses || polygonFreeTicketsAddresses.length === 0) {
    console.warn(
        "Polygon token-gated contract addresses not found or intentionally left empty. Ensure contracts are deployed or set the TOKEN_GATED_POLY_CONTRACT_ADDRESSES environment variable to the appropriate value."
    );
} else {
    console.log(
        `Using Polygon token-gated contract addresses: ${polygonFreeTicketsAddresses}`
    );
}

if (!baseFreeTicketsAddresses || baseFreeTicketsAddresses.length === 0) {
    console.warn(
        "Base token-gated contract addresses not found or intentionally left empty. Ensure contracts are deployed or set the TOKEN_GATED_BASE_CONTRACT_ADDRESSES environment variable to the appropriate value."
    );
} else {
    console.log(
        `Using Base token-gated contract addresses: ${baseFreeTicketsAddresses}`
    );
}

if (!avaxFreeTicketsAddresses || avaxFreeTicketsAddresses.length === 0) {
    console.warn(
        "Avax token-gated contract addresses not found or intentionally left empty. Ensure contracts are deployed or set the TOKEN_GATED_AVAX_CONTRACT_ADDRESSES environment variable to the appropriate value."
    );
} else {
    console.log(
        `Using Avax token-gated contract addresses: ${avaxFreeTicketsAddresses}`
    );
}
/**
 * Backend API response interface for Claimed Ticket API
 */
export interface ClaimedTicketApiResponse
    extends BackendApiResponse<IClaimedTicket> {
    data?: IClaimedTicket | null;
}

type RequestResponse = ClaimedTicketApiResponse;

interface RequestBody {
    seriesId: string;
    eventId: string;
    isEventLive: boolean;
}

async function handler(
    req: NextApiRequest,
    res: NextApiResponse<RequestResponse>,
    user: IUser
) {
    try {
        const { seriesId, eventId, isEventLive } = req.body as RequestBody;
        const walletAddress = user.walletProvider?.address;
        const additionalWallets = user.walletProvider?.additionalWallets || [];
        const walletAddresses: string[] = walletAddress
            ? [walletAddress, ...additionalWallets]
            : [];

        // Validate request method
        if (req.method !== "POST") {
            return res.status(405).json({
                success: false,
                message: `Method ${req.method} Not Allowed`,
            });
        }

        // Verify fields for checking claimed ticket
        const missingFields = [];
        if (!user._id) missingFields.push("user ID");
        if (!eventId) missingFields.push("event ID");

        if (missingFields.length) {
            const errMsg = `Missing required fields: ${missingFields.join(
                ", "
            )}`;
            console.error(errMsg);
            return res.status(400).json({
                success: false,
                message: errMsg,
            });
        }

        const nftAccessRepository = diContainer.get<INftAccessRepository>(
            "INftAccessRepository"
        );

        const claimedTicketRepository: IClaimedTicketRepository =
            diContainer.get("IClaimedTicketRepository");

        // Step 1: Check if the user already has a claimed ticket
        const claimedTicketDoc: ClaimedTicketDoc | null =
            await claimedTicketRepository.getClaimedTicketByUserAndEvent(
                user._id!.toString(),
                eventId
            );

        // If the user already has a claimed ticket, return it
        if (claimedTicketDoc) {
            const claimedTicket: IClaimedTicket =
                claimedTicketDoc.toObject() as IClaimedTicket;
            return res.status(200).json({
                success: true,
                message: `User [${user._id}] already has a claimed ticket.`,
                data: claimedTicket,
            });
        }

        // Add blacklist check here
        if (walletAddresses.length > 0 && BLACKLISTED_WILDPASS_TOKENIDS.length > 0) {
            const isBlacklisted = await doesAddressHaveWildpassTokens(
                walletAddresses,
                BLACKLISTED_WILDPASS_TOKENIDS
            );
            const infoMsg = `User [${user._id}] is blacklisted. They are not allowed to claim a ticket.`;
            if (isBlacklisted) {
                console.info(infoMsg);
                return res.status(200).json({
                    success: false,
                    message:
                        "This Wildpass is blacklisted. Please reach out to Community for more information.",
                });
            }
        }

        // Verify fields for checking NFT ownership
        if (!walletAddress) missingFields.push("wallet address");
        if (!seriesId) missingFields.push("series ID");
        if (!isEventLive) missingFields.push("event status (isEventLive)");

        // Step 2: Check NFT ownership
        // Leverage short-circuiting on each validation step to avoid unnecessary checks
        let isAdmissible = false;
        let usedNft: NftAccessDetails | null = null;

        if (!isAdmissible && isEventLive) {
            for (const address of walletAddresses) {
                const ownedWildpasses = await fetchNftsForOwnerEth(address, [
                    getEthWildpassContractAddress(),
                ]);

                if (ownedWildpasses && ownedWildpasses.ownedNfts.length > 0) {
                    for (const nft of ownedWildpasses.ownedNfts) {
                        const hasBeenUsed =
                            await nftAccessRepository.hasNftBeenUsed(
                                ChainType.ETH,
                                nft.contract.address,
                                nft.tokenId,
                                eventId
                            );

                        if (!hasBeenUsed) {
                            isAdmissible = true;
                            usedNft = {
                                chain: ChainType.ETH,
                                collectionAddress: nft.contract.address,
                                tokenId: nft.tokenId,
                            };
                            break;
                        }
                    }
                }
                if (isAdmissible) break;
            }
        }

        //Eth Token Gating
        if (
            !isAdmissible &&
            isEventLive &&
            ethFreeTicketsAddresses?.length > 0
        ) {
            for (const address of walletAddresses) {
                const ownedEthNftsResp = await fetchNftsForOwnerEth(
                    address,
                    ethFreeTicketsAddresses
                );

                if (ownedEthNftsResp && ownedEthNftsResp.ownedNfts.length > 0) {
                    for (const nft of ownedEthNftsResp.ownedNfts) {
                        const hasBeenUsed =
                            await nftAccessRepository.hasNftBeenUsed(
                                ChainType.ETH,
                                nft.contract.address,
                                nft.tokenId,
                                eventId
                            );

                        if (!hasBeenUsed) {
                            isAdmissible = true;
                            usedNft = {
                                chain: ChainType.ETH,
                                collectionAddress: nft.contract.address,
                                tokenId: nft.tokenId,
                            };
                            break;
                        }
                    }
                }
                if (isAdmissible) break;
            }
        }

        //Polygon Token Gating
        if (
            !isAdmissible &&
            isEventLive &&
            polygonFreeTicketsAddresses?.length > 0
        ) {
            for (const address of walletAddresses) {
                const ownedPolygonNftsResp = await fetchNftsForOwnerPolygon(
                    address,
                    polygonFreeTicketsAddresses
                );

                if (
                    ownedPolygonNftsResp &&
                    ownedPolygonNftsResp?.ownedNfts.length > 0
                ) {
                    for (const nft of ownedPolygonNftsResp.ownedNfts) {
                        const hasBeenUsed =
                            await nftAccessRepository.hasNftBeenUsed(
                                ChainType.POLYGON,
                                nft.contract.address,
                                nft.tokenId,
                                eventId
                            );

                        if (!hasBeenUsed) {
                            isAdmissible = true;
                            usedNft = {
                                chain: ChainType.POLYGON,
                                collectionAddress: nft.contract.address,
                                tokenId: nft.tokenId,
                            };
                            break;
                        }
                    }
                }
                if (isAdmissible) break;
            }
        }

        //Base Token Gating
        if (
            !isAdmissible &&
            isEventLive &&
            baseFreeTicketsAddresses?.length > 0
        ) {
            for (const address of walletAddresses) {
                const ownedBaseNftsResp = await fetchNftsForOwnerBase(
                    address,
                    baseFreeTicketsAddresses
                );

                if (
                    ownedBaseNftsResp &&
                    ownedBaseNftsResp?.ownedNfts.length > 0
                ) {
                    for (const nft of ownedBaseNftsResp.ownedNfts) {
                        const hasBeenUsed =
                            await nftAccessRepository.hasNftBeenUsed(
                                ChainType.BASE,
                                nft.contract.address,
                                nft.tokenId,
                                eventId
                            );

                        if (!hasBeenUsed) {
                            isAdmissible = true;
                            usedNft = {
                                chain: ChainType.BASE,
                                collectionAddress: nft.contract.address,
                                tokenId: nft.tokenId,
                            };
                            break;
                        }
                    }
                }
                if (isAdmissible) break;
            }
        }

        //Avax Token Gating
        if (
            !isAdmissible &&
            isEventLive &&
            avaxFreeTicketsAddresses?.length > 0
        ) {
            for (const address of walletAddresses) {
                const ownedAvaxNftsResp = await fetchNftsForOwnerAvax(
                    address,
                    avaxFreeTicketsAddresses
                );

                if (
                    ownedAvaxNftsResp &&
                    ownedAvaxNftsResp?.ownedNfts.length > 0
                ) {
                    for (const nft of ownedAvaxNftsResp.ownedNfts) {
                        const hasBeenUsed =
                            await nftAccessRepository.hasNftBeenUsed(
                                ChainType.AVAX,
                                nft.contract.address,
                                nft.tokenId,
                                eventId
                            );

                        if (!hasBeenUsed) {
                            isAdmissible = true;
                            usedNft = {
                                chain: ChainType.AVAX,
                                collectionAddress: nft.contract.address,
                                tokenId: nft.tokenId,
                            };
                            break;
                        }
                    }
                }
                if (isAdmissible) break;
            }
        }

        if (
            !isAdmissible &&
            isEventLive &&
            erc20EthFreeTicketsAddresses?.length > 0 &&
            minTokensHeldToAllowEntryToAnEvent !== BigInt(-1)
        ) {
            // This is a map of contract address to token balance because we need to sum up the token balances for each wallet address they have associated
            const erc20TokenBalances: {
                [address: string]: BigInt;
            } = {};
            for (const address of walletAddresses) {
                // Get the ERC20 token balances for the user for the current wallet address
                const ownedEthErc20TokenBalancesResp =
                    await getEthErc20TokenBalances(
                        address,
                        erc20EthFreeTicketsAddresses
                    );
                if (
                    ownedEthErc20TokenBalancesResp &&
                    ownedEthErc20TokenBalancesResp.length > 0
                ) {
                    // Iterate through the ERC20 token balances for the current wallet address
                    for (const tokenBalance of ownedEthErc20TokenBalancesResp) {
                        const currContractAddress =
                            tokenBalance.contractAddress;
                        const currTokenBalanceForAllWallets =
                            erc20TokenBalances[currContractAddress];
                        const currTokenBalanceForThisWallet =
                            tokenBalance.tokenBalance;

                        // Add new entry to erc20TokenBalances if it doesn't exist, otherwise sum up the token balances
                        erc20TokenBalances[currContractAddress] =
                            currTokenBalanceForAllWallets
                                ? currTokenBalanceForAllWallets +
                                  currTokenBalanceForThisWallet
                                : currTokenBalanceForThisWallet;

                        if (
                            currTokenBalanceForAllWallets >=
                            minTokensHeldToAllowEntryToAnEvent
                        ) {
                            // If the user has enough tokens held for any of the ERC20 token-gated contracts, they are admissible
                            console.info(
                                `User [${user._id}] admitted with ${erc20TokenBalances[currContractAddress]} tokens held for contract address: ${currContractAddress}`
                            );
                            isAdmissible = true;
                            break;
                        }
                    }
                }
                if (isAdmissible) break;
            }
        }

        if (
            !isAdmissible &&
            isEventLive &&
            erc20StakingContractAddresses?.length > 0 &&
            minStakedErc20TokensHeldToAllowEntryToAnEvent !== BigInt(-1)
        ) {
            const hasSufficientErc20Stake =
                await hasSufficientErc20StakedTokens(walletAddresses);
            if (hasSufficientErc20Stake) {
                isAdmissible = true;
                console.info(`User [${user._id}] admitted with staked tokens`);
            }
        }

        // Check credit balance if user is eligible for entry based on the minimum credits required
        if (!isAdmissible && isEventLive && user._id) {
            const creditBalanceRepository: ICreditBalanceRepository =
                diContainer.get("ICreditBalanceRepository");

            // Get the user's current balance (credits)
            const creditBalance =
                await creditBalanceRepository.getBalanceByUserId(
                    user._id.toString()
                );

            // If the user has enough credits, they are admissible
            if (creditBalance && creditBalance.balance >= minCreditsRequired) {
                isAdmissible = true;
                console.info(
                    `User [${user._id}] admitted with credit balance of ${creditBalance.balance} for event ID: ${eventId}`
                );
            } else {
                const balanceValue = creditBalance ? creditBalance.balance : 0;
                console.info(
                    `User [${user._id}] has insufficient credit balance: ${balanceValue}/${minCreditsRequired}`
                );
            }
        }

        if (!isAdmissible) {
            const errMsg = `User [${user._id}] does not meet requirements for claiming a ticket.`;
            console.info(errMsg);
            return res.status(200).json({
                success: false,
                message: `You don't meet the requirements for this event. You need either a qualifying NFT or ${minCreditsRequired.toLocaleString()} credits.`,
            });
        }

        // Step 3: Generate an access code and claim the ticket
        const accessCodeData = {
            organizationId: null,
            codeType: usedNft
                ? AccessCodeType.NFT_ACCESS
                : AccessCodeType.SINGLE_USE,
            maxQuantity: 1,
            seriesId: new Types.ObjectId(seriesId),
            intent: AccessCodeIntent.TICKET,
            tier: TicketTierType.GENERAL_ADMISSION,
        };

        const accessCode: string | null = await createAccessCode(
            accessCodeData
        );

        if (!accessCode) {
            const errMsg = `Failed to generate access code for user [${user._id}] at series ID: ${seriesId}`;
            return res.status(500).json({
                success: false,
                message: errMsg,
            });
        }

        // Step 4: Claim the ticket using the access code
        const claimedTicket: IClaimedTicket | null =
            await claimTicketViaAccessCode(
                user._id!.toString(),
                eventId,
                accessCode
            );

        // Add NFT access entry if an NFT was used
        if (usedNft && !!user._id) {
            await nftAccessRepository.createNftAccess({
                chain: usedNft.chain,
                collectionAddress: usedNft.collectionAddress,
                tokenId: usedNft.tokenId,
                eventId: eventId,
                userId: user._id?.toString(),
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        const infoMsg = `Claimed ticket for user [${user._id}] at series ID: ${seriesId} with access code: ${accessCode}`;
        console.info(infoMsg);
        res.status(200).json({
            success: true,
            data: claimedTicket,
            message: infoMsg,
        });
    } catch (error: any) {
        console.error("Error processing ticket claim:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

export default authorize(handler);
