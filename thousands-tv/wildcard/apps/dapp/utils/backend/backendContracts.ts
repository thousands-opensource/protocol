import { ethers, Wallet } from "ethers";
import { WildcardSwagContract } from "@/contracts/swag/Swag";
import { WildpassContract } from "@/contracts/wildpass/Wildpass";
import { FoundersCoinContract } from "@/contracts/ygg/FoundersCoin";
import { SwordAndShieldContract } from "@/contracts/ygg/SwordAndShield";
import { ThousandsCampaignContract } from "@/contracts/thousands/ThousandsCampaign";
import { getLocalRPCProvider, isLocalEnvironment, getEthRPCProvider } from "@/utils/environmentUtil";

const FOUNDRY_PK =
    "0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97";
if (!process.env.PRIVATE_KEY) {
    console.warn("PRIVATE_KEY environment variable not set");
}

const PK = process.env.PRIVATE_KEY || FOUNDRY_PK;

// --- RPC provider selection based on environment ---
const RPC_PROVIDER = isLocalEnvironment() ? getLocalRPCProvider() : process.env.RPC_PROVIDER;

export const BACKEND_PROVIDER = ethers.getDefaultProvider(RPC_PROVIDER);
const BACKEND_WALLET = new Wallet(PK, BACKEND_PROVIDER);
export const SWAG_CONTRACT = new WildcardSwagContract(BACKEND_WALLET);

export function getBackendWalletAddress() {
    return BACKEND_WALLET.address;
}

// --- Ethereum RPC provider ---
const ETH_RPC_PROVIDER = isLocalEnvironment() ? getLocalRPCProvider() : process.env.ETH_RPC_PROVIDER;


export const BACKEND_ETH_PROVIDER = ethers.getDefaultProvider(ETH_RPC_PROVIDER);

// Wildpass contract (ETH)
export const WILDPASS_CONTRACT = new WildpassContract(BACKEND_ETH_PROVIDER);

// YGG contracts (read only)
export const FOUNDERS_COIN_CONTRACT = new FoundersCoinContract(
    BACKEND_ETH_PROVIDER
);
export const SWORD_AND_SHIELD_CONTRACT = new SwordAndShieldContract(
    BACKEND_ETH_PROVIDER
);

// Thousands Campaign contract for server-side payouts
export const THOUSANDS_CAMPAIGN_CONTRACT = new ThousandsCampaignContract(BACKEND_WALLET);
