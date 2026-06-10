import { WILDCARD_SWAG_CONTRACT } from "@src/contracts/WildcardSwag";
import { BigNumber } from "ethers";
import { ContractResult, EMPTY_TOKEN_METADATA } from "@src/types";
import { getDiscordBotWalletAddress } from "@src/util/blockchainUtil";
import { logError, logInfo } from "@src/logger";
import { getTokenMetadata } from "@src/util/util";
import {
    AirdropResultData,
    AirdropTransactionData,
    TransactionDBParams,
    Transaction,
} from "@repo/interfaces";
import {
    getMinBotTokenBalance,
    isProdEnvironment,
} from "@src/util/environmentUtil";
import { airdropTokenToUser } from "@src/transactionQueue/blockchainTransaction";
import { findOneUserByQuery } from "@repo/schemas";

export async function handleAirdropTransaction(
    transaction: Transaction,
    transactionDBParams: TransactionDBParams
): Promise<ContractResult> {
    // Initialize the result data
    const resultData: AirdropResultData = {
        success: false,
        txnHash: "",
        airdropTokenId: "",
        airdropErrorMsg: "",
    };

    try {
        // Parse the transaction data
        const { recipientDBId, tokenIdStr } = JSON.parse(
            transaction.data
        ) as AirdropTransactionData;
        resultData.airdropTokenId = tokenIdStr;

        logInfo(
            `Processing Airdrop transaction in the Transaction Queue [${transactionDBParams.transactionQueueId}] for Recipient #${recipientDBId}, Token ID: ${tokenIdStr}`
        );

        //-----Verify constraints are met
        // Verify the recipient's recipient object & wallet address
        const recipientUser = await findOneUserByQuery({
            _id: recipientDBId,
        });

        if (!recipientUser) {
            const errMsg = `Recipient with ID '${recipientDBId}' does not exist`;
            logError(errMsg);
            resultData.airdropErrorMsg = errMsg;
            return {
                success: false,
                data: JSON.stringify(resultData),
                err: errMsg,
            };
        }

        if (!recipientUser.walletProvider?.address) {
            const errMsg = `Recipient with ID '${recipientDBId}' does not have a wallet address`;
            logError(errMsg);
            resultData.airdropErrorMsg = errMsg;
            return {
                success: false,
                data: JSON.stringify(resultData),
                err: errMsg,
            };
        }

        // Make sure the bot has enough tokens in its wallet to complete the airdrop
        const tokenIdBN = BigNumber.from(tokenIdStr);
        const discordBotWalletAddress = getDiscordBotWalletAddress();
        const botBalanceBN = await WILDCARD_SWAG_CONTRACT.tokenBalanceOf(
            discordBotWalletAddress,
            tokenIdBN
        );
        const botBalance = botBalanceBN.toNumber();
        const minBalanceRequired = getMinBotTokenBalance();
        if (botBalance < minBalanceRequired) {
            const errMsg = `Failed to airdrop the recipient with User ID #${recipientUser._id}. Bot balance for Token ID '${tokenIdStr}' is too low. Current balance: ${botBalance}, Minimum balance: ${minBalanceRequired}. To airdrop, transfer the tokens to my address: ${discordBotWalletAddress}`;
            logInfo(errMsg);
            resultData.airdropErrorMsg = errMsg;
            return {
                success: false,
                data: JSON.stringify(resultData),
                err: errMsg,
            };
        }

        //-----Write the Airdrop to chain
        const airdropResult = await airdropTokenToUser(
            recipientUser.walletProvider.address,
            tokenIdBN,
            transactionDBParams,
            true
        );

        // Record the result data
        resultData.txnHash = airdropResult.txHash;
        resultData.success = airdropResult.success;

        let tokenMetadata = EMPTY_TOKEN_METADATA;
        if (isProdEnvironment()) {
            tokenMetadata = await getTokenMetadata(tokenIdStr);
        }
        const tokenLabel = tokenMetadata?.name || tokenIdStr;
        if (!airdropResult.success) {
            const errMsg = `⚠️Failed to airdrop **${tokenLabel}** Swag to ***${recipientUser.walletProvider.address}***. Txn Hash: ${resultData.txnHash}, ${airdropResult.err}.`;
            logError(errMsg);
            resultData.airdropErrorMsg = errMsg;
            return {
                success: false,
                data: JSON.stringify(resultData),
                err: errMsg,
            };
        }

        logInfo(
            `Successfully airdropped  **${tokenLabel}** Swag to ***${recipientUser.walletProvider.address}***. Txn Hash: ${resultData.txnHash}`
        );

        return {
            success: airdropResult.success,
            data: JSON.stringify(resultData),
            txHash: airdropResult.txHash,
        };
    } catch (e) {
        logError(`Error processing Airdrop transaction: ${e.message}`);
        return {
            success: false,
            data: JSON.stringify(resultData),
            err: e.message,
        };
    }
}
