import { logError, logInfo } from "@src/logger";
import {
    getKudosChannelId,
    getPrivateAdminChannelId,
} from "@src/util/environmentUtil";
import {
    sendMessageToChannel,
    getChannel,
    getBlockchainTxnArbButton,
} from "@src/util/discordUtil";
import { getBlockExplorerTxUrl } from "@src/util/blockchainUtil";
import {
    TextChannel,
    AttachmentBuilder,
    ButtonBuilder,
    ButtonStyle,
} from "discord.js";
import { Types } from "mongoose";
import { ContractResult } from "@src/types";
import { getTokenMetadata } from "@src/util/util";
import {
    AirdropResultData,
    GiveKudosCompletionData,
    IKudosEvent,
    ITransactionQueue,
    TxnTypeEnum,
    KudosTransactionData,
} from "@repo/interfaces";
import { createKudosEvent, findOneUserByQuery } from "@repo/schemas";

export async function completeGiveKudosTransactionBundle(
    activeTransactionQueue: ITransactionQueue
): Promise<ContractResult> {
    logInfo(
        `Processing Give Kudos completion function -  Transaction queue [${activeTransactionQueue._id}], ${activeTransactionQueue.bundleType}`
    );
    // Initialize the result data
    const txnBundle = activeTransactionQueue.txnBundle;
    const completionData: GiveKudosCompletionData = {
        kudosEventId: new Types.ObjectId(),
        broadcasted: false,
    };

    try {
        //-----Validate the transaction bundle
        if (!txnBundle || txnBundle.length === 0) {
            const errMsg = `Transaction queue object not found for ID: ${activeTransactionQueue._id}`;
            logError(errMsg);
            return {
                success: false,
                data: JSON.stringify(completionData),
                err: errMsg,
            };
        }

        //-----Parse the necessary data. Loop through prior transactions to extract relevant data
        let recipientDBId,
            adminDBId,
            kudosType,
            kudosReason,
            kudosWildeventId,
            kudosTxnHash,
            tokenIdStr,
            airdropTxnHash,
            airdropSuccess,
            airdropErrMsg;

        for (const transaction of txnBundle) {
            if (transaction.type === TxnTypeEnum.KUDOS) {
                const kudosData = JSON.parse(
                    transaction.data
                ) as KudosTransactionData;
                ({ recipientDBId, adminDBId, kudosType, kudosReason } =
                    kudosData);
            }

            if (transaction.type === TxnTypeEnum.AIRDROP) {
                const airdropResultData = JSON.parse(
                    transaction.resultData
                ) as AirdropResultData;
                tokenIdStr = airdropResultData.airdropTokenId;
                airdropTxnHash = airdropResultData.txnHash;
                airdropSuccess = airdropResultData.success;
                airdropErrMsg = airdropResultData.airdropErrorMsg;
            }
        }

        // Ensure the necessary data was found
        // Don't check for kudosReason since it's optional
        const missingDataFields = [];
        if (!kudosType) missingDataFields.push("kudosType");
        if (!kudosWildeventId) missingDataFields.push("kudosWildeventId");
        if (!kudosTxnHash) missingDataFields.push("kudosTxnHash");
        if (!tokenIdStr) missingDataFields.push("tokenIdStr");
        if (!airdropTxnHash) missingDataFields.push("airdropTxnHash");
        if (airdropSuccess === undefined)
            missingDataFields.push("airdropSuccess");

        if (missingDataFields.length > 0) {
            const errMsg = `Necessary data not found in prior transactions: ${missingDataFields.join(
                ", "
            )}`;
            logError(errMsg);
            return {
                success: false,
                data: JSON.stringify(completionData),
                err: errMsg,
            };
        }

        //-----Write Kudos to DB
        const newKudosEventDB: IKudosEvent = {
            type: kudosType,
            recipientUserId: recipientDBId,
            awardedByUserId: adminDBId,
            airdropTokenId: tokenIdStr,
            airdropTxnHash: airdropTxnHash,
            reason: kudosReason,
        };
        const kudosEventDB = await createKudosEvent(newKudosEventDB);
        completionData.kudosEventId = kudosEventDB._id;

        //-----Broadcast the Kudos Event results to the Kudos Channel
        // Retrieve the recipient & admin user object
        const recipientUserObj = await findOneUserByQuery({
            _id: recipientDBId,
        });

        if (!recipientUserObj || !recipientUserObj.walletProvider?.address) {
            const errMsg = `Recipient with ID '${recipientDBId}' does not exist or does not have a wallet address in the database.`;
            logError(errMsg);
            return {
                success: false,
                data: JSON.stringify(completionData),
                err: errMsg,
            };
        }

        const adminUserObj = await findOneUserByQuery({
            _id: adminDBId,
        });

        if (!adminUserObj || !adminUserObj.walletProvider?.address) {
            const errMsg = `Submitted Admin with ID '${adminDBId}' does not exist or does not have a wallet address in the database.`;
            logError(errMsg);
            return {
                success: false,
                data: JSON.stringify(completionData),
                err: errMsg,
            };
        }

        // Retrieve Kudos Channel
        const kudosChannelId = getKudosChannelId();
        if (!kudosChannelId) {
            const errMsg = `Cannot retrieve kudos channel, KUDOS_CHANNEL_ID env var must be set before giving kudos.`;
            logError(errMsg);
            return {
                success: false,
                data: JSON.stringify(completionData),
                err: errMsg,
            };
        }

        let kudosChannel: TextChannel;
        try {
            kudosChannel = await getChannel(kudosChannelId);
        } catch (e) {
            const errMsg = `Unable to retrieve kudos channel, please check that the KUDOS_CHANNEL_ID env var is correctly set.`;
            logInfo(errMsg);
            return {
                success: false,
                data: JSON.stringify(completionData),
                err: errMsg,
            };
        }

        let broadcastErr = "";
        const tokenMetadata = await getTokenMetadata(tokenIdStr);
        const tokenLabel = tokenMetadata.name || tokenIdStr;
        const viewTxnButtons = getBlockchainTxnArbButton(
            kudosTxnHash,
            "View Kudos Transaction"
        );
        const airdropTxnUrl = getBlockExplorerTxUrl(airdropTxnHash);
        const recipientIdentifier = recipientUserObj.discordProvider?.id
            ? `<@${recipientUserObj.discordProvider?.id}>`
            : `User [${recipientUserObj._id}]`;

        try {
            const tokenImg = tokenMetadata.image;
            const recipientPublicMention =
                recipientUserObj.preferences?.showLinkedSocials &&
                recipientUserObj.discordProvider?.id
                    ? `<@${recipientUserObj.discordProvider.id}>`
                    : `***User ID*** ***${recipientDBId}*** ***Holder***`;

            if (!airdropSuccess) {
                await kudosChannel.send({
                    content: `Congratulations ${recipientPublicMention}! You've been awarded a kudos: ***${kudosType}***, unfortunately there was an issue airdropping the Swag Token ***${tokenLabel}*** \n* Reason For Kudos: ${
                        kudosReason || "N/A"
                    }`,
                    components: [viewTxnButtons],
                    files: tokenImg ? [new AttachmentBuilder(tokenImg)] : [],
                });
            } else {
                const viewAirdropButton = new ButtonBuilder() // have to use ButtonBuilder() instead of getBlockchainTxnArbButton() so that we can use .addComponents with it
                    .setLabel("View Airdrop Transaction")
                    .setStyle(ButtonStyle.Link)
                    .setURL(airdropTxnUrl);
                viewTxnButtons.addComponents(viewAirdropButton);

                await kudosChannel.send({
                    content: `Congratulations ${recipientPublicMention}! You've been awarded a kudos: ***${kudosType}*** and have been airdropped the Swag Token ***${tokenLabel}***! \n* Reason For Kudos: ${
                        kudosReason || "N/A"
                    }`,
                    components: [viewTxnButtons],
                    files: tokenImg ? [new AttachmentBuilder(tokenImg)] : [],
                });
            }
        } catch (e) {
            broadcastErr =
                "Failed to broadcast kudos message to kudos channel. The kudos event was still created successfully.\n\n";
            logError(broadcastErr, e);
        }

        //----Send reply to admin
        const airdropResultMsg =
            airdropErrMsg ||
            `Successfully airdropped ${recipientIdentifier} token **${tokenLabel}** to address ***${recipientUserObj.walletProvider?.address}***.`;
        const kudosSuccessMsg = `Successfully wrote **Kudos** **Wildevent** to chain for ${recipientIdentifier}!\n * User ID: ${recipientDBId}\n* Type: ${kudosType} \n* Reason: ${kudosReason}\n* Awarded By: ${
            adminUserObj.discordProvider?.id
                ? `<@${adminUserObj.discordProvider.id}>`
                : `***User ID*** ***${adminDBId}*** ***Holder***`
        }`;
        logInfo(kudosSuccessMsg);
        const summaryMessage = `${broadcastErr}${kudosSuccessMsg}\n\n${airdropResultMsg}`;
        await kudosChannel.send({ content: summaryMessage });

        await sendMessageToChannel(getPrivateAdminChannelId(), summaryMessage);

        logInfo(
            `Give Kudos Event successfully concluded. Kudos Event ID: ${completionData.kudosEventId}, Kudos Txn Hash: ${kudosTxnHash}, Airdrop Txn Hash: ${airdropTxnHash}`
        );

        return {
            success: true,
            data: JSON.stringify(completionData),
        };
    } catch (e) {
        logError(`Error processing Kudos Conclusion transaction: ${e.message}`);
        return {
            success: false,
            data: JSON.stringify(completionData),
            err: e.message,
        };
    }
}
