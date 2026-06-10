import { IManualAirdrop } from "@repo/interfaces";
import {
    AIRDROP_ADDRESSES_INPUT_FIELD,
    GET_AIRDROP_ADDRESSES_MODAL_ID,
    SWAG_AIRDROP_BATCH_SIZE,
    TOKEN_ID_INPUT_FIELD,
} from "@src/constants";
import { WILDCARD_SWAG_CONTRACT } from "@src/contracts/WildcardSwag";
import { insertManyManualAirdrops } from "@repo/schemas";
import { logError, logInfo } from "@src/logger";
import {
    distributeSwag,
    getDiscordBotWalletAddress,
    wildcardDistributorSetApprovalForAllWildcardSwag,
} from "@src/util/blockchainUtil";
import { addModalField, addModalFieldParagraph } from "@src/util/modalUtil";
import {
    ChatInputCommandInteraction,
    ModalBuilder,
    ModalSubmitInteraction,
} from "discord.js";
import { BigNumber, ethers } from "ethers";

/**
 * Handles airdropping a specific token to a list of valid addresses
 * @param interaction - chat input command
 */
export async function handleAirdropSwag(
    interaction: ChatInputCommandInteraction
) {
    let mb = new ModalBuilder()
        .setCustomId(GET_AIRDROP_ADDRESSES_MODAL_ID)
        .setTitle("Airdrop a Token to a List of Addresses");

    addModalField(
        mb,
        TOKEN_ID_INPUT_FIELD,
        `Input the token ID`,
        true,
        `Enter a valid token ID`
    );

    addModalFieldParagraph(
        mb,
        AIRDROP_ADDRESSES_INPUT_FIELD,
        `Input a list of addresses`,
        true,
        4000,
        1,
        `Enter a list of addresses - comma separated`
    );

    await interaction.showModal(mb);
}

/**
 *
 * @param interaction - modal submit interaction
 */
export async function handleAirdropSwagModalSubmit(
    interaction: ModalSubmitInteraction
) {
    const userTag = interaction.user.tag;
    const tokenIdString = interaction.fields
        .getTextInputValue(TOKEN_ID_INPUT_FIELD)
        .trim();
    await interaction.reply({
        content: `${userTag} submitted the airdrop swag modal for token id: ${tokenIdString}`,
        ephemeral: true,
    });

    // Parse the Token Id
    const tokenId = parseInt(tokenIdString);
    if (isNaN(tokenId)) {
        const errMsg = `Invalid token ID: ${tokenIdString}`;
        logError(errMsg);
        await interaction.editReply(errMsg);
        return;
    }
    const tokenIdBN = BigNumber.from(tokenId);

    // list of addresses, strip whitespace and split by comma
    const addressList = interaction.fields
        .getTextInputValue(AIRDROP_ADDRESSES_INPUT_FIELD)
        .split(",");

    // If no addresses were provided, return
    const addressListCount = addressList.length;
    if (addressListCount === 0) {
        const msg = `No addresses provided for airdrop.`;
        logInfo(msg);
        await interaction.editReply(msg);
        return;
    }
    // If an address is invalid, return
    const validAddresses = [];
    for (let address of addressList) {
        address = address.trim();
        const isValid = ethers.utils.isAddress(address);
        if (!isValid) {
            const errorMsg = `Invalid address found: ${address}`;
            logError(errorMsg);
            await interaction.editReply(errorMsg);
            return;
        }
        validAddresses.push(address);
    }

    // Get token balance
    const tokenBalanceBn = await WILDCARD_SWAG_CONTRACT.tokenBalanceOf(
        getDiscordBotWalletAddress(),
        tokenIdBN
    );
    let tokenBalance = tokenBalanceBn.toNumber();
    if (tokenBalance < addressListCount) {
        const errMsg = `Token ${tokenId}'s balance of ${tokenBalance} is less than the number of addresses provided: ${addressListCount}`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    // Set approval for all on the Wildcard Swag contract for the Wildcard Distributor contract
    await wildcardDistributorSetApprovalForAllWildcardSwag();

    let successfulAirdropAddresses: string[] = [];
    let addressBatch: string[] = [];
    for (let i = 0; i < addressListCount; i++) {
        const address = validAddresses[i];
        addressBatch.push(address);

        if (
            (i + 1) % SWAG_AIRDROP_BATCH_SIZE === 0 ||
            i === addressListCount - 1
        ) {
            // Airdrop the tokens via the WildcardDistributor contract
            const tokenIds = new Array(addressBatch.length).fill(tokenIdBN);
            const distributeContractResult = await distributeSwag(
                addressBatch,
                tokenIds
            );

            // If the airdrop was not successful, return an error message
            if (!distributeContractResult.success) {
                await interaction.editReply(
                    `There was an error airdropping. \nSuccessfully airdropped to ${successfulAirdropAddresses.length} addresses.`
                );
                return;
            }

            // Add DB entry for each manual airdrop
            const distributionTxnHash = distributeContractResult.txHash;
            const airdrops: IManualAirdrop[] = addressBatch.map(
                (recipientAddress) => {
                    return {
                        address: recipientAddress,
                        txnHash: distributionTxnHash,
                        tokenId: tokenId,
                    };
                }
            );

            try {
                await insertManyManualAirdrops(airdrops);
                logInfo(
                    `Distributed tokens to ${addressBatch.length} users. TxnHash: ${distributionTxnHash}`
                );
            } catch (error) {
                logError(
                    `Failed to update DB for addresses: ${addressBatch.join(
                        ", "
                    )}. Error: ${error}`
                );
                await interaction.editReply(
                    `There was an error after ${successfulAirdropAddresses.length} successful airdrops`
                );
                return;
            }

            successfulAirdropAddresses.push(...addressBatch);
            addressBatch = [];
        }
    }

    const successMsg = `Successfully distributed tokens & updated DB entries: ${successfulAirdropAddresses.length} out of ${addressListCount}`;

    logInfo(successMsg);
    await interaction.editReply(successMsg);
}
