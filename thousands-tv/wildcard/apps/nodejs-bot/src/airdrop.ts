import { getAirdropAdminRole, getRole, hasRole } from "@src/util/roleUtil";
import {
    ButtonInteraction,
    GuildMember,
    ModalBuilder,
    ModalSubmitInteraction,
    Role,
} from "discord.js";
import { BigNumber } from "ethers";
import { logError, logInfo } from "@src/logger";
import { CLAIM_AIRDROP_ADDRESS, CLAIM_AIRDROP_MODAL_ID } from "./constants";
import { WILDCARD_SWAG_CONTRACT } from "./contracts/WildcardSwag";
import { ContractResult } from "./types";
import {
    getBlockExplorerTxUrl,
    getDiscordBotWalletAddress,
    isValidAddress,
} from "./util/blockchainUtil";
import {
    alertAirdropAdmins,
    broadcastMessageToAirdropChannel,
    createClaimAirdropThread,
    getBlockchainTxnArbButton,
    getThreadChannel,
    getGuild,
} from "./util/discordUtil";
import {
    getMaxUsersPerThread,
    getMinBotTokenBalanceNotification,
} from "./util/environmentUtil";
import { addModalField } from "./util/modalUtil";
import { AirdropEligibleUser } from "@repo/interfaces";
import {
    AirdropDoc,
    findAirdropsByQuery,
    findOneAirdropByQuery,
    updateAirdropEligibleUserDB,
    updateOneAirdropDB,
} from "@repo/schemas";

/**
 * Called when a role is added to a user. Starts the airdrop process if necessary
 * @param member - user to airdrop to
 * @param airdropDoc - airdrop to add to
 */
export async function addUserToAirdrop(
    member: GuildMember,
    airdropDoc: AirdropDoc
): Promise<AirdropDoc> {
    // add the user list of airdrop eligible users
    airdropDoc = await addUserToAirdropEligibleUsers(airdropDoc, member);

    // add the user to the claim airdrop thread
    airdropDoc = await addUserToClaimAirdropThread(airdropDoc, member);

    return airdropDoc;
}

/**
 * Handles adding user to airdrop eligible user list
 * @param airdropDoc - airdrop doc to check and update
 * @param member - member to add
 */
export async function addUserToAirdropEligibleUsers(
    airdropDoc: AirdropDoc,
    member: GuildMember
): Promise<AirdropDoc> {
    const discordId = member.user.id;
    const userTag = member.user.tag;

    // see if this user is already on the list of eligible users
    const aeuIds =
        airdropDoc.airdropEligibleUsers?.map((aeu) => aeu.discordId) || [];
    const alreadyAdded = aeuIds.includes(discordId);

    if (alreadyAdded) {
        logInfo(`${userTag} is already on the list of airdrop eligible users.`);
        return;
    }

    // store this user's claim airdrop data
    const airdropEligibleUser: AirdropEligibleUser = {
        discordTag: userTag,
        discordId,
        hasClaimed: false,
    };
    airdropDoc = await updateOneAirdropDB(airdropDoc._id, {
        $push: { airdropEligibleUsers: airdropEligibleUser },
    });
    logInfo(`Successfully added ${userTag} to list of airdrop eligible users.`);
    return airdropDoc;
}

/**
 * Handles logic of adding a user to a claim airdrop thread
 * @param airdropDoc - airdrop doc being affected
 * @param member - user to be added
 */
export async function addUserToClaimAirdropThread(
    airdropDoc: AirdropDoc,
    member: GuildMember
): Promise<AirdropDoc> {
    // make sure they haven't already claimed this airdrop before adding them to a thread
    const role = await getRole(airdropDoc.roleRequiredId);
    const discordId = member.user.id;
    const userTag = member.user.tag;
    const aeuClaimedIds =
        airdropDoc.airdropEligibleUsers
            ?.filter((aeu) => aeu.hasClaimed)
            .map((aeu) => aeu.discordId) || [];
    const alreadyClaimed = aeuClaimedIds.includes(discordId);
    if (alreadyClaimed) {
        logInfo(
            `${userTag} has already claimed airdrop and will not be added to new thread.`
        );
        return;
    }

    // check that airdrop thread exists
    const threadIds = airdropDoc.claimAirdropThreadIds;
    if (!threadIds || threadIds.length < 1) {
        logError(
            `Failed to find latest claim airdrop thread for airdrop ${airdropDoc._id}, threads do not exist.`
        );
        return;
    }

    // get the most recent thread id created for this airdrop
    const latestClaimAirdropThreadId = threadIds[threadIds.length - 1];

    // start the airdrop process for this user, add them to the private thread
    let claimAirdropThread = await getThreadChannel(latestClaimAirdropThreadId);

    // check if limit is going to be reached when adding new user to thread
    const maxUsersPerThread = getMaxUsersPerThread();
    if (claimAirdropThread.members.cache.size + 1 > maxUsersPerThread) {
        // go through logic of creating new thread
        const tokenLabel = airdropDoc.tokenMetadata.name || airdropDoc.tokenId;
        const threadNumber = threadIds.length + 1;
        const threadName = `Claim airdrop for the '${role.name}' role (${tokenLabel} Swag)! #${threadNumber}`;
        logInfo(
            `Thread member count limit reached.  Creating new thread: 
            ${threadName}`
        );

        const newClaimAirdropThread = await createClaimAirdropThread(
            threadName,
            airdropDoc,
            role
        );

        airdropDoc = await updateOneAirdropDB(airdropDoc._id, {
            $push: { claimAirdropThreadIds: newClaimAirdropThread.id },
        });

        claimAirdropThread = newClaimAirdropThread;
    }

    // add the user to the thread
    try {
        await claimAirdropThread.members.add(discordId);
    } catch (e) {
        logError(
            `Failed to add user '${userTag}' to thread ${claimAirdropThread.name}`,
            e
        );
    }
    logInfo(
        `Successfully added ${userTag} to thread ID ${claimAirdropThread.id}: ${claimAirdropThread.name}`
    );
    return airdropDoc;
}

/**
 * Handler when a user clicks the 'Claim Airdrop' button in their airdrop thread
 * @param interaction
 */
export async function handleClaimAirdropButton(interaction: ButtonInteraction) {
    const claimAirdropModal = buildClaimAirdropModal();
    interaction.showModal(claimAirdropModal);
}

function buildClaimAirdropModal(): ModalBuilder {
    const mb = new ModalBuilder()
        .setCustomId(CLAIM_AIRDROP_MODAL_ID)
        .setTitle("Claim your Airdrop!");
    addModalField(
        mb,
        CLAIM_AIRDROP_ADDRESS,
        "Address to airdrop token to",
        true,
        "ex. 0xab5801a7d398351b8be11c439e05c5b3259aec9b"
    );
    return mb;
}

export async function handleClaimAirdropModalSubmit(
    interaction: ModalSubmitInteraction
) {
    // Reply immediately so the command does not time out
    await interaction.reply({
        content: "Attempting to airdrop your Swag... hang tight",
        ephemeral: true,
    });

    const discordId = interaction.user.id;
    const userTag = interaction.user.tag;
    const address = interaction.fields.getTextInputValue(CLAIM_AIRDROP_ADDRESS);
    logInfo(
        `${userTag} submitted modal to claim airdrop to address '${address}'`
    );

    // make sure the address given is valid
    if (!isValidAddress(address)) {
        const errMsg = `'${address}' is not a valid address, please submit a valid wallet address where we can airdrop the token`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    // find the airdrop that is associated with this thread
    const claimAirdropThreadId = interaction.channel.id;
    const airdropDoc = await findOneAirdropByQuery({
        claimAirdropThreadIds: claimAirdropThreadId,
    });
    // make sure airdrop is still active
    if (!airdropDoc || !airdropDoc.active) {
        const errMsg = "Airdrop is no longer active";
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    // make sure the user has the role required
    const roleRequired: Role = await getRole(airdropDoc.roleRequiredId);
    const hasRoleRequired: boolean = hasRole(
        interaction.member as GuildMember,
        airdropDoc.roleRequiredId
    );
    if (!hasRoleRequired) {
        const errMsg = `You must have the ${roleRequired} role to be eligible to claim this airdrop.`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    // find the user's info for this airdrop
    const airdropEligibleUsers: AirdropEligibleUser[] =
        airdropDoc.airdropEligibleUsers?.filter((aeu: AirdropEligibleUser) => {
            return aeu.discordId === discordId;
        });
    if (!airdropEligibleUsers || airdropEligibleUsers.length !== 1) {
        const errMsg = `You are not eligible for this airdrop, failed to find airdrop info for userID: ${discordId}`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    // make sure they haven't already claimed it
    const airdropEligibleUser = airdropEligibleUsers[0];
    if (airdropEligibleUser.hasClaimed) {
        const errMsg = `You have already claimed this airdrop! I sent the Swag to '${airdropEligibleUser.address}'`;
        logInfo(
            `${errMsg}\n
            ${getBlockExplorerTxUrl(airdropEligibleUser.txnHash)}\n
            airdropDocId: ${airdropDoc._id}`
        );
        const viewTxnButton = getBlockchainTxnArbButton(
            airdropEligibleUser.txnHash
        );
        await interaction.editReply({
            content: errMsg,
            components: [viewTxnButton],
        });
        return;
    }

    const tokenIdStr = airdropDoc.tokenId;
    logInfo(
        `${userTag} is able to claim airdrop. Airdropping token '${tokenIdStr}' to address '${address}'`
    );

    // perform the airdrop
    const tokenLabel = airdropDoc.tokenMetadata.name || tokenIdStr;
    const tokenIdBN = BigNumber.from(tokenIdStr);
    const result: ContractResult = await WILDCARD_SWAG_CONTRACT.airdropToken(
        address,
        tokenIdBN
    );
    if (!result.success) {
        const errMsg = `Failed to airdrop ***${tokenLabel}*** Swag to '${address}', please try again`;
        logInfo(errMsg);
        await interaction.editReply(errMsg);
        return;
    }

    // update the DB to say they've claimed the airdrop
    const txHash = result.data.txHash;
    airdropEligibleUser.hasClaimed = true;
    airdropEligibleUser.address = address;
    airdropEligibleUser.txnHash = txHash;
    updateAirdropEligibleUserDB(airdropDoc._id, discordId, airdropEligibleUser);

    // tell the user the airdrop was successful
    logInfo(
        `Successfully airdropped '${userTag}' token '${tokenLabel}' (${tokenIdStr}) to address '${address}'. TxnUrl: ${getBlockExplorerTxUrl(
            txHash
        )}`
    );
    const successMsg = `Congratulations ${interaction.user}!!! I successfully airdropped your ***${tokenLabel}*** Swag to address '${address}'! It may take a few minutes for the transaction to be confirmed and the Swag to show up in your wallet`;
    const viewTxnButton = getBlockchainTxnArbButton(txHash);

    const replyMsg = {
        content: successMsg,
        components: [viewTxnButton],
    };
    await interaction.editReply(replyMsg);

    // broadcast the success message to the thread so everyone can see!
    const claimAirdropThread = await getThreadChannel(claimAirdropThreadId);
    if (!claimAirdropThread) {
        logError(
            `Failed to find claim airdrop thread with ID: ${claimAirdropThreadId}, not broadcasting message`
        );
        return;
    }
    try {
        await claimAirdropThread.send(
            `Congratulations ${interaction.user}!!! I successfully airdropped your ***${tokenLabel}*** Swag`
        );
    } catch (e) {
        logError(
            `Error sending message to notify ${interaction.user.username} in thread channel: `,
            e
        );
    }

    // check remaining bot token balance and notify admin if too low
    await broadcastMessageIfTokenBalanceTooLow(tokenIdBN, tokenLabel);
}

/**
 * Called on startup to handle any user who may have been granted an airdrop-eligible role while the bot was offline
 */
export async function reconcileAirdropsOnStartup() {
    logInfo(
        "Reconciling airdrops on startup... checking if any users were given an airdrop-eligible role while I was offline"
    );

    const guild = await getGuild();
    const activeAirdropsDoc: AirdropDoc[] = await findAirdropsByQuery({
        active: true,
    });
    for (const activeAirdropDoc of activeAirdropsDoc) {
        const roleRequired: Role = guild.roles.cache.get(
            activeAirdropDoc.roleRequiredId
        );
        const tokenLabel =
            activeAirdropDoc.tokenMetadata.name || activeAirdropDoc.tokenId;
        logInfo(
            `The '${roleRequired.name}' role airdrop for ${tokenLabel} is active, checking if any users were given that role while I was offline`
        );
        // find all the users who started the claim airdrop process
        const userIdsWhoStartedClaimAirdropProcess =
            activeAirdropDoc.airdropEligibleUsers?.map((aeu) => aeu.discordId);
        // check if there are any eligible users who haven't started the claim process
        roleRequired.members.forEach(async (member: GuildMember) => {
            const didUserStartClaimAirdropProcess: boolean =
                userIdsWhoStartedClaimAirdropProcess.indexOf(member.id) > -1;
            if (!didUserStartClaimAirdropProcess) {
                // they must have been given the role while the bot was offline, so start the airdrop process for them
                logInfo(
                    `Noticed that user '${member.user.tag}' has the '${roleRequired.name}' role and is eligible for airdrop token ${activeAirdropDoc.tokenMetadata.name} (${activeAirdropDoc.tokenId})`
                );
                await addUserToAirdrop(member, activeAirdropDoc);
            }
        });
    }

    logInfo("Finished reconciling airdrops on startup");
}

/**
 * Check if number of airdrop eligible users yet to claim token surpasses number of tokens
 * @param airdrop - airdrop containing token in question
 */
export async function notifyIfEligibleUsersExceedsBotTokens(
    airdrop: AirdropDoc
) {
    const role = await getRole(airdrop.roleRequiredId);
    const airdropsWithToken: AirdropDoc[] = await findAirdropsByQuery({
        tokenId: airdrop.tokenId,
        active: true,
    });
    let numAeuUnclaimed = 0;
    for (const airdrop of airdropsWithToken) {
        const aeuUnclaimed = airdrop.airdropEligibleUsers.filter(
            (aeu) => !aeu.hasClaimed
        );
        numAeuUnclaimed += aeuUnclaimed.length;
    }
    const tokenIdStr = airdrop.tokenId;
    const tokenLabel = airdrop.tokenMetadata.name || tokenIdStr;

    const botWalletAddress = getDiscordBotWalletAddress();
    const tokenIdBN = BigNumber.from(tokenIdStr);
    const botTokenBalanceBN = await WILDCARD_SWAG_CONTRACT.tokenBalanceOf(
        botWalletAddress,
        tokenIdBN
    );
    const botTokenBalance = botTokenBalanceBN.toNumber();

    if (numAeuUnclaimed >= botTokenBalance) {
        const airdropAdminRole: Role = await getAirdropAdminRole();
        const msg = `${airdropAdminRole}, I only have ${botTokenBalance} ***${tokenLabel}*** swag pins remaining, and ${numAeuUnclaimed} users are still eligible to claim that pin across all active airdrops. Please send me more pins or stop awarding the ${role} role`;
        logInfo(msg);
        await broadcastMessageToAirdropChannel(msg);
    }
}

/**
 * Checks token balance and notifies admin channel if balance is getting low
 * @param tokenIdBN - token to check balance of
 * @param tokenLabel - token display label
 */
export async function broadcastMessageIfTokenBalanceTooLow(
    tokenIdBN: BigNumber,
    tokenLabel: string
) {
    const botWalletAddress = getDiscordBotWalletAddress();
    const botTokenBalanceBN = await WILDCARD_SWAG_CONTRACT.tokenBalanceOf(
        botWalletAddress,
        tokenIdBN
    );
    const botTokenBalance = botTokenBalanceBN.toNumber();
    const minTokenBalanceRequired = getMinBotTokenBalanceNotification();
    if (botTokenBalance <= minTokenBalanceRequired) {
        // send alert message to admin
        console.warn(
            `Bot token ${tokenLabel} balance is getting low: ${botTokenBalance}`
        );
        const airdropAdminRole: Role = await getAirdropAdminRole();
        try {
            // send low token balance notification to private admin channel
            await alertAirdropAdmins(
                `${airdropAdminRole} My ***${tokenLabel}*** balance is getting low. I only have ***${botTokenBalance}*** pins remaining. Please send more to my address *${botWalletAddress}*`
            );
        } catch (e) {
            logError(
                `Error sending message to notify token balance in thread channel`,
                e
            );
        }
    }
}
