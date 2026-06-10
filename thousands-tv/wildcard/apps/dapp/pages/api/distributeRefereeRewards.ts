import { sendApiResponse } from "@/utils/backend/apiUtil";
import { NextApiRequest, NextApiResponse } from "next";
import { IUser, UserRole, WildcardApiResponse } from "@repo/interfaces";
import { authorize } from "./middleware/authorization";
import {
    createPublicClient,
    createWalletClient,
    formatUnits,
    http,
    parseGwei,
    parseUnits,
} from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import {
    getIvsIdleGamePlatformApiKey,
    getIvsTokenDistributionUrl,
    getPubnubPublishKey,
    getPubnubSecretKey,
    getPubnubSubscribeKey,
} from "@/utils/environmentUtilWCA";
import PubNub, { SignalEvent } from "pubnub";
import { callAnthropicLLM } from "./pledgeAI/lib/anthropicClient";
import IStageRepository from "@/repositories/interfaces/iStageRepository";
import { diContainer } from "@/inversify.config";
import axios from "axios";

const CONTRACT_ADDRESS = "0x449843Db3A40445793ED4253b01578F8BdA82621";
const TOKEN_ADDRESS = "0xa2CC7d44b03E335781F982d7F4ab3235Bb68Da1e";

const CONTRACT_ABI = [
    {
        inputs: [
            { internalType: "address", name: "token", type: "address" },
            {
                internalType: "address[]",
                name: "recipients",
                type: "address[]",
            },
            {
                internalType: "uint256[]",
                name: "amounts",
                type: "uint256[]",
            },
        ],
        name: "distributeTokens",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
];
const TOKEN_ABI = [
    {
        type: "function",
        name: "balanceOf",
        inputs: [{ name: "owner", type: "address", internalType: "address" }],
        outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
        stateMutability: "view",
    },
];

interface UserReward {
    userId: string;
    fanId: string;
    fanName: string;
    walletAddress: string;
    allocatedTokens: number;
    scoreBreakdown: {
        messageScore: number;
        reactionScore: number;
        wildpassAndSwagpinHoldingsScore: number;
        boostScore: number;
        totalScore: number;
    };
}
interface Body {
    distributionResult: {
        topUsers: UserReward[];
    };
    totalTokens: number;
    maxTokensPerUser: number;
    noOfUsersDistributed: number;
}

async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "POST") {
        sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
        });
        return;
    }

    try {
        // Destructure stageId and rest of the request body containing ai insights and etc.
        const { stageId, ...requestBody } = req.body;
        const rewardJSON = JSON.stringify(requestBody);

        /*
        const messagePrompt =
            "In a sports referee voice that is making a call on the field, explain each of the items in the topUsers array as if it was a referee call.  Be sure to reference each item by the fanName.  Refer to ALLOCATED TOKENS as tokens.  When describing scores try to do so in a qualitative rather than quantitative manner.  Multiply each score by 10 and round to whole numbers.  Only use the top 3 items in the topUsers array.  No more than two short sentences per item.  Be sure to use a different pattern for how you describe each item.  Here is the JSON to process: " +
            rewardJSON;

        const tokenDistributionUrl = getIvsTokenDistributionUrl();
        const ivsIdleGamePlatformApiKey = getIvsIdleGamePlatformApiKey();
        await axios.post(tokenDistributionUrl, req.body, {
            headers: {
                "Content-Type": "application/json",
                "x-api-key": ivsIdleGamePlatformApiKey,
            },
        });
        */

        // const messageAgent = await callAnthropicLLM(messagePrompt);
        // console.log("messageAgent: ", messageAgent);

        // //@ts-ignore
        // const messageText = messageAgent.content[0].text;

        // const _pubnub = new PubNub({
        //     publishKey: getPubnubPublishKey(),
        //     subscribeKey: getPubnubSubscribeKey(),
        //     secretKey: getPubnubSecretKey(),
        //     userId: "producer-overlay-meter",
        // });

        // var publishConfig = {
        //     channel: "stream-overlay",
        //     message: {
        //         RefereeCallText: messageText,
        //     },
        // };

        // _pubnub.publish(publishConfig, function (status, response) {
        //     // Publish message to current channel.
        //     console.log(status, response);
        // });

        // const BATCH_SIZE = 50;
        // const MIN_SEPOLIA_BALANCE = 0.03;
        // const body: Body = requestBody;

        // const PRIVATE_KEY_RAW = process.env.REFEREE_PKEY;

        // if (!PRIVATE_KEY_RAW) {
        //     sendApiResponse(res, {
        //         success: false,
        //         err: "Private key not found. Please set env var REFEREE_PKEY",
        //     });
        //     return;
        // }

        // const SEPOLIA_RPC = process.env.SEPOLIA_RPC;

        // if (!SEPOLIA_RPC) {
        //     sendApiResponse(res, {
        //         success: false,
        //         err: "Sepolia rpc not found. Please set env var SEPOLIA_RPC",
        //     });
        //     return;
        // }

        // const PRIVATE_KEY = PRIVATE_KEY_RAW.startsWith("0x")
        //     ? PRIVATE_KEY_RAW
        //     : `0x${PRIVATE_KEY_RAW}`;

        // // Initialize viem clients
        // const publicClient = createPublicClient({
        //     chain: sepolia,
        //     transport: http(SEPOLIA_RPC),
        // });

        // const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
        // const walletClient = createWalletClient({
        //     account,
        //     chain: sepolia,
        //     transport: http(SEPOLIA_RPC),
        // });

        // // make sure user has enough balance token and enough eth to pay gas
        // const sepoliaBalanceRaw = await publicClient.getBalance({
        //     address: account.address,
        // });
        // const sepoliaBalance = Number(formatUnits(sepoliaBalanceRaw, 18));
        // console.log("sepoliaBalance", sepoliaBalance);

        // if (sepoliaBalance < MIN_SEPOLIA_BALANCE) {
        //     sendApiResponse(res, {
        //         success: false,
        //         err: "Not enough Sepolia balance",
        //         data: account.address,
        //     });
        //     return;
        // }

        // // Get token balance from the contract
        // const tokenBalanceRaw = (await publicClient.readContract({
        //     address: TOKEN_ADDRESS,
        //     abi: TOKEN_ABI,
        //     functionName: "balanceOf",
        //     args: [account.address],
        // })) as undefined | bigint;
        // const tokenBalance = Number(
        //     formatUnits(tokenBalanceRaw || BigInt(0), 18)
        // );

        // console.log("tokenBalance", tokenBalance);

        // // Check if user has enough token balance
        // if (tokenBalance < body.totalTokens) {
        //     sendApiResponse(res, {
        //         success: false,
        //         err: "Not enough token balance",
        //         data: account.address,
        //     });
        //     return;
        // }

        // // get recipients and amounts
        // const recipients = body.distributionResult.topUsers.map(
        //     (user) => user.walletAddress
        // );
        // const amounts = body.distributionResult.topUsers.map((user) =>
        //     parseUnits(user.allocatedTokens.toString(), 18)
        // );

        // // get maxFeePerGas
        // const feesPerGas = await publicClient.estimateFeesPerGas();
        // console.log("feesPerGas", feesPerGas);

        // const maxFeePerGasViem = feesPerGas.maxFeePerGas || BigInt(0);
        // const defaultMaxFeePerGas = parseGwei("120");
        // console.log("defaultMaxFeePerGas", defaultMaxFeePerGas);

        // const maxFeePerGas =
        //     defaultMaxFeePerGas > maxFeePerGasViem
        //         ? defaultMaxFeePerGas
        //         : maxFeePerGasViem;

        // // get maxPriorityFeePerGas
        // const maxPriorityFeePerGasViem =
        //     await publicClient.estimateMaxPriorityFeePerGas();
        // const defaultMaxPriorityFeePerGas = parseGwei("3");
        // console.log("defaultMaxPriorityFeePerGas", defaultMaxPriorityFeePerGas);
        // const maxPriorityFeePerGas =
        //     defaultMaxPriorityFeePerGas > maxPriorityFeePerGasViem
        //         ? defaultMaxPriorityFeePerGas
        //         : maxPriorityFeePerGasViem;

        // const defaultGas = BigInt(300000);

        // console.log("maxPriorityFeePerGas", maxPriorityFeePerGas);
        // console.log("maxFeePerGas", maxFeePerGas);

        // // Run distributeTokens in batches
        // const hashes = [];
        // for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        //     const recipientGroup = recipients.slice(i, i + BATCH_SIZE);
        //     const amountGroup = amounts.slice(i, i + BATCH_SIZE);
        //     const { request } = await publicClient.simulateContract({
        //         address: CONTRACT_ADDRESS,
        //         abi: CONTRACT_ABI,
        //         functionName: "distributeTokens",
        //         args: [TOKEN_ADDRESS, recipientGroup, amountGroup],
        //         account: walletClient.account,
        //         maxFeePerGas,
        //         maxPriorityFeePerGas,
        //         gas: defaultGas, // use a conservative default gas value
        //     });

        //     const hash = await walletClient.writeContract(request);
        //     hashes.push(hash);
        // }

        // console.log("Successfully distributed rewards", hashes);

        const stageRepository: IStageRepository =
            diContainer.get("IStageRepository");

        // Increment to next segment
        const updatedStage =
            await stageRepository.updateEventIncrementCurrentSegement(stageId);

        // Return immediately after getting the transaction hash
        const war: WildcardApiResponse = {
            success: true,
            data: {
                // hashes: hashes,
                currentSegment: updatedStage?.currentSegment || 0,
            },
        };
        sendApiResponse(res, war);
    } catch (e: any) {
        console.error("Error distributing rewards", e);
        sendApiResponse(res, {
            success: false,
            err: `Error distributing rewards ${e.message}`,
        });
    }
}

export default authorize(handler, [UserRole.ADMIN]);
