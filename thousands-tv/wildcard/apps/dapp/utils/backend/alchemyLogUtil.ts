import { getAlchemyProvider } from "@/utils/backend/alchemyUtil";

const TRANSFER_ERC721 =
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const TRANSFER_SINGLE =
    "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62";
const TRANSFER_BATCH =
    "0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb";

type LogEntry = {
    topics?: string[];
    data?: string;
};

function normalizeAddress(addr?: string | null) {
    return String(addr || "").trim().toLowerCase();
}

function topicToAddress(topic?: string | null) {
    if (!topic) return "";
    return `0x${topic.slice(-40).toLowerCase()}`;
}

function hexToBigInt(hex?: string | null) {
    if (!hex || hex === "0x") return BigInt(0);
    return BigInt(hex);
}

function readWord(data: string, index: number) {
    const start = 2 + index * 64;
    return data.slice(start, start + 64);
}

function readArray(data: string, offsetBytes: bigint) {
    const offset = Number(offsetBytes);
    const start = 2 + offset * 2;
    const lenHex = data.slice(start, start + 64);
    const len = Number(`0x${lenHex}`);
    const arr: bigint[] = [];
    for (let i = 0; i < len; i++) {
        const word = data.slice(start + 64 * (i + 1), start + 64 * (i + 2));
        arr.push(BigInt(`0x${word}`));
    }
    return arr;
}

async function rpc(
    alchemy: ReturnType<typeof getAlchemyProvider>,
    method: string,
    params: unknown[]
) {
    if (!alchemy) {
        throw new Error("Alchemy provider unavailable");
    }
    const core = (alchemy as any).core;
    if (!core?.send) {
        throw new Error("Alchemy core.send unavailable");
    }
    return core.send(method, params);
}

async function getLogsInRange(
    alchemy: ReturnType<typeof getAlchemyProvider>,
    fromBlock: string,
    toBlock: string,
    address: string
) {
    const params = [
        {
            fromBlock,
            toBlock,
            address,
            topics: [[TRANSFER_ERC721, TRANSFER_SINGLE, TRANSFER_BATCH]],
        },
    ];
    return rpc(alchemy, "eth_getLogs", params);
}

export async function collectLogsForContract(
    alchemy: ReturnType<typeof getAlchemyProvider>,
    contractAddress: string,
    startingBlockNumber: number
) {
    const latestHex = await rpc(alchemy, "eth_blockNumber", []);
    const latest = Number(latestHex);
    const chunkSize = 200000;
    const logs: LogEntry[] = [];
    const first = Math.max(0, Number(startingBlockNumber) || 0);

    for (let start = first; start <= latest; start += chunkSize) {
        const end = Math.min(start + chunkSize - 1, latest);
        const fromBlock = `0x${start.toString(16)}`;
        const toBlock = `0x${end.toString(16)}`;
        try {
            const part = await getLogsInRange(
                alchemy,
                fromBlock,
                toBlock,
                contractAddress
            );
            logs.push(...(part || []));
        } catch (err: any) {
            const msg = String(err?.message || "").toLowerCase();
            if (msg.includes("log response size exceeded") || msg.includes("too many")) {
                if (start === end) throw err;
                const mid = Math.floor((start + end) / 2);
                const left = await getLogsInRange(
                    alchemy,
                    `0x${start.toString(16)}`,
                    `0x${mid.toString(16)}`,
                    contractAddress
                );
                const right = await getLogsInRange(
                    alchemy,
                    `0x${(mid + 1).toString(16)}`,
                    `0x${end.toString(16)}`,
                    contractAddress
                );
                logs.push(...(left || []), ...(right || []));
            } else {
                throw err;
            }
        }
    }

    return logs;
}

export function buildBalancesFromLogsForOwners(
    logs: LogEntry[],
    owners: Set<string>
) {
    const balancesByOwner = new Map<string, Map<string, bigint>>();

    const update = (owner: string, tokenId: bigint, delta: bigint) => {
        if (!owners.has(owner)) {
            return;
        }
        const tokenKey = tokenId.toString();
        let ownerMap = balancesByOwner.get(owner);
        if (!ownerMap) {
            ownerMap = new Map();
            balancesByOwner.set(owner, ownerMap);
        }
        const prev = ownerMap.get(tokenKey) || BigInt(0);
        ownerMap.set(tokenKey, prev + delta);
    };

    for (const log of logs) {
        const topic0 = log.topics?.[0]?.toLowerCase();
        if (!topic0) continue;

        if (topic0 === TRANSFER_ERC721) {
            const from = topicToAddress(log.topics?.[1]);
            const to = topicToAddress(log.topics?.[2]);
            const tokenId = hexToBigInt(log.topics?.[3]);
            if (to) update(to, tokenId, BigInt(1));
            if (from) update(from, tokenId, BigInt(-1));
        } else if (topic0 === TRANSFER_SINGLE) {
            const from = topicToAddress(log.topics?.[2]);
            const to = topicToAddress(log.topics?.[3]);
            const data = log.data || "0x";
            const id = hexToBigInt(`0x${readWord(data, 0)}`);
            const value = hexToBigInt(`0x${readWord(data, 1)}`);
            if (to) update(to, id, value);
            if (from) update(from, id, -value);
        } else if (topic0 === TRANSFER_BATCH) {
            const from = topicToAddress(log.topics?.[2]);
            const to = topicToAddress(log.topics?.[3]);
            const data = log.data || "0x";
            const idsOffset = hexToBigInt(`0x${readWord(data, 0)}`);
            const valuesOffset = hexToBigInt(`0x${readWord(data, 1)}`);
            const ids = readArray(data, idsOffset);
            const values = readArray(data, valuesOffset);
            for (let i = 0; i < ids.length; i++) {
                const id = ids[i];
                const value = values[i] || BigInt(0);
                if (to) update(to, id, value);
                if (from) update(from, id, -value);
            }
        }
    }

    const normalized = new Map<string, Map<string, string>>();
    for (const [owner, tokenMap] of Array.from(
        balancesByOwner.entries()
    )) {
        const filtered = new Map<string, string>();
        for (const [tokenId, qty] of Array.from(tokenMap.entries())) {
            if (qty > BigInt(0)) {
                filtered.set(tokenId, qty.toString());
            }
        }
        if (filtered.size > 0) {
            normalized.set(normalizeAddress(owner), filtered);
        }
    }

    return normalized;
}
