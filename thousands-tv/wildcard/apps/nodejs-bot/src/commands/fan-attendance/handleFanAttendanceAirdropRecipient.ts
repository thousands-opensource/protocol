import {
    findOneAirdropFanAttendanceByQuery,
    updateAirdropFanAttendanceEligibleUserDB,
    findOneDiscordEventByQuery,
    DiscordStageDoc,
} from "@repo/schemas";
import {
    getDiscordUserReference,
    sendMessageToChannel,
} from "../../util/discordUtil";
import { getMember } from "@src/util/roleUtil";
import { logError, logInfo } from "@src/logger";
import { client } from "@src/index";
import { BigNumber } from "ethers";
import { WILDCARD_SWAG_CONTRACT } from "@src/contracts/WildcardSwag";
import { ContractResult } from "@src/types";
import { getBlockExplorerTxUrl } from "@src/util/blockchainUtil";
import { getAirdropChannelId } from "@src/util/environmentUtil";
import { handleAddMessageToQueueAirdropRecipient as notifyGameServerOfConfirmedAirdropToRecipient } from "@src/redis/utils";
import { addUserToAirdropFanAttendanceEligibleUsers } from "@src/airdropFanAttendance";
import { getCurrentUnixTimestampSeconds } from "@src/util/util";
import { isPlaytestEvent } from "@src/util/fanAttendanceUtil";
import { AirdropEligibleUser, IAirdropFanAttendance } from "@repo/interfaces";
import { findOneUserByQuery } from "@repo/schemas";

/**
 * Handles airdropping a token to a user during an in-game, if they are eligible
 * @param discordId - discordId of the user to airdrop to
 * @param sessionCode - sessionCode of the event
 */
export async function handleFanAttendanceAirdropToRecipient(
    discordId: string,
    sessionCode: string
) {
    if (!sessionCode || !discordId) {
        const errMsg = `Cannot airdrop token. No sessionCode or discordId provided`;
        logInfo(errMsg);
        return;
    }

    // get member by discordId - check if user is within the guild
    const discordMember = await getMember(discordId);

    if (!discordMember) {
        const errMsg = `Cannot airdrop token. No member found with discordId ${discordId}`;
        logInfo(errMsg);
        return;
    }

    const userTag = client.users.cache.get(discordId).tag;

    const query = {
        status: "active",
        sessionCode: sessionCode,
    };

    const discordEvent: DiscordStageDoc = await findOneDiscordEventByQuery(
        query
    );
    if (!discordEvent) {
        logInfo(
            `No active playtest enabled event found for sessionCode: ${sessionCode}.`
        );
        return;
    }

    if (!isPlaytestEvent(discordEvent.discordEventType)) {
        const errMsg = `No active game enabled event found for sessionCode: ${sessionCode}. Cannot record user activity`;
        logInfo(errMsg);
        return;
    }

    // check if user has attended the event
    const isEventAttendee = discordEvent.channelEntrances?.some(
        (entrance) => entrance.discordId === discordId
    );

    if (!isEventAttendee) {
        const errMsg = `Cannot airdrop token. User ${userTag} has not attended the event`;
        logInfo(errMsg);
        return;
    }

    const airdropDoc = await findOneAirdropFanAttendanceByQuery({
        sessionCode: sessionCode,
    });

    if (!airdropDoc) {
        const errMsg = `Cannot airdrop token. No active airdrop found for sessionCode: ${sessionCode}`;
        logInfo(errMsg);
        return;
    }

    // add airdrop to eligible users before claiming
    const updatedMemberEligibilityAirdrop =
        await addUserToAirdropFanAttendanceEligibleUsers(
            airdropDoc,
            discordMember
        );

    if (!updatedMemberEligibilityAirdrop) {
        const errMsg = `Cannot airdrop token. Failed to add user to airdrop eligible users`;
        logInfo(errMsg);
        return;
    }

    logInfo(
        `attempting to airdrop to user: ${discordMember.avatar}, discordId: ${discordId} `
    );

    // validate user eligibility and airdrop token via swag pin safe transfer
    await fanAttendanceAirdropRecipient(
        discordId,
        updatedMemberEligibilityAirdrop
    );
}

/**
 * Airdrop a token on-chain to a user during an in-game event
 * @param discordId - discordId of the user to airdrop to
 * @param airdropFanAttendanceDoc - airdrop doc to airdrop from
 * @returns
 */
export async function fanAttendanceAirdropRecipient(
    discordId: string,
    airdropFanAttendanceDoc: IAirdropFanAttendance
) {
    const liveEventsAirdropNotificationsChannel = getAirdropChannelId();
    const liveEventsFanAttendanceAirdropNotificationsChannelId =
        airdropFanAttendanceDoc.eventChanelId;

    if (!discordId) {
        const errMsg = `Cannot airdrop token. No discordId provided`;
        logInfo(errMsg);
        return;
    }

    // fetch user by discordId from db (must be a valid user)
    const user = await findOneUserByQuery({ "discordProvider.id": discordId });
    if (!user) {
        const errMsg = `Cannot airdrop token. No user found with discordId ${discordId}`;
        logInfo(errMsg);
        return;
    }

    // find the user's info for this airdrop
    const airdropFanAttendanceEligibleUsers: AirdropEligibleUser[] =
        airdropFanAttendanceDoc.airdropEligibleUsers?.filter(
            (aeu: AirdropEligibleUser) => {
                return aeu.discordId === discordId;
            }
        );
    if (
        !airdropFanAttendanceEligibleUsers ||
        airdropFanAttendanceEligibleUsers.length !== 1
    ) {
        const errMsg = `${discordId} is not eligible for this airdrop, failed to find airdrop info for userID: ${discordId}`;
        logInfo(errMsg);
        return;
    }

    // make sure they haven't already claimed it
    const airdropFanAttendanceEligibleUser =
        airdropFanAttendanceEligibleUsers[0];
    if (airdropFanAttendanceEligibleUser.hasClaimed) {
        const errMsg = `You have already claimed this airdrop! I sent the Swag to '${airdropFanAttendanceEligibleUser.address}'`;
        logInfo(
            `${errMsg}\n
            ${getBlockExplorerTxUrl(airdropFanAttendanceEligibleUser.txnHash)}\n
            airdropDocId: ${airdropFanAttendanceDoc._id}`
        );
        await sendMessageToChannel(liveEventsAirdropNotificationsChannel, {
            content: errMsg,
        });
        return;
    }

    const tokenIdStr = airdropFanAttendanceDoc.tokenId;
    const walletAddress = user.walletProvider?.address;

    logInfo(
        `${user.discordProvider?.discordTag} is able to claim airdrop. Airdropping token '${tokenIdStr}' to address '${walletAddress}'`
    );

    // check eligibility of user (based on having their a wallet address linked)
    if (!walletAddress) {
        const errMsg = `Cannot airdrop token. User ${discordId} is not eligible`;
        logInfo(errMsg);
        return;
    }

    const tokenLabel = airdropFanAttendanceDoc.tokenMetadata.name || tokenIdStr;
    const tokenIdBN = BigNumber.from(tokenIdStr);
    const result: ContractResult = await WILDCARD_SWAG_CONTRACT.airdropToken(
        walletAddress,
        tokenIdBN
    );

    if (!result.success) {
        const errMsg = `Failed to airdrop ***${tokenLabel}*** Swag to '${walletAddress}'`;
        logError(errMsg);
        return;
    }

    // update the DB to say they've claimed the airdrop
    const txHash = result.data.txHash;
    airdropFanAttendanceEligibleUser.hasClaimed = true;
    airdropFanAttendanceEligibleUser.address = walletAddress;
    airdropFanAttendanceEligibleUser.txnHash = txHash;
    updateAirdropFanAttendanceEligibleUserDB(
        airdropFanAttendanceDoc._id,
        discordId,
        airdropFanAttendanceEligibleUser
    );

    logInfo(
        `Successfully airdropped!'${
            user.discordProvider?.discordTag
        }' token '${tokenLabel}' (${tokenIdStr}) to address '${walletAddress}'. TxnUrl: ${getBlockExplorerTxUrl(
            txHash
        )}\n\n`
    );

    const discordMemberReference = await getDiscordUserReference(discordId);
    const successMsg = `Congratulations 🎉🎉 ${discordMemberReference}!!! I successfully airdropped your ***${tokenLabel}*** Swag to your address! It may take a few minutes for the transaction to be confirmed and the Swag to show up in your wallet`;

    const replyMsg = {
        content: successMsg,
    };

    // Send txn confirmation to gaming client upon a successful airdrop
    const sessionCode = airdropFanAttendanceDoc.sessionCode;
    const queueKey = `eventChannelAirdropConfirmation-${sessionCode}`;
    const timestampUnix = getCurrentUnixTimestampSeconds();

    const message = {
        discordId: discordId,
        sessionCode: sessionCode,
        timestamp: timestampUnix,
        txnHash: txHash,
    };

    // send message txn hash confirming airdrop to gaming client
    await notifyGameServerOfConfirmedAirdropToRecipient(queueKey, message);

    // live-event-notifications channel
    await sendMessageToChannel(
        liveEventsFanAttendanceAirdropNotificationsChannelId,
        replyMsg
    );
}
