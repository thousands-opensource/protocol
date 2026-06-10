import { Chain, configureChains, createClient } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { polygon, polygonMumbai, localhost, foundry } from "wagmi/chains";
import {
    connectorsForWallets,
    getDefaultWallets,
} from "@rainbow-me/rainbowkit";
import { WILDCARD_APP_NAME } from "../constants/constants";
import {
    getAlchemyApiKey,
    getEnvironment,
    getWalletConnectProjectId,
} from "./environmentUtil";
import { phantomWallet } from "@rainbow-me/rainbowkit/wallets";
import { defineChain } from "viem";

export const conduit = defineChain({
    id: 15933,
    name: "Fire",
    network: "conduit-testnet",
    nativeCurrency: { name: "Sepolia ETH", symbol: "sETH", decimals: 18 },
    rpcUrls: {
        default: {
            http: ["https://rpc-thousands-testnet-qc3tb4l1gu.t.conduit.xyz"],
        },
        public: {
            http: ["https://rpc-thousands-testnet-qc3tb4l1gu.t.conduit.xyz"],
        },
    },
    blockExplorers: {
        default: {
            name: "Blockscout",
            url: "https://explorer-thousands-testnet-qc3tb4l1gu.t.conduit.xyz",
        },
    },
});

// Defined in Base Docs: https://docs.base.org/docs/using-base/
export const base = defineChain({
    id: 8453, // Chain ID for Base Mainnet
    name: "Base",
    network: "Base Mainnet",
    nativeCurrency: {
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ["https://mainnet.base.org"],
        },
        public: {
            http: ["https://mainnet.base.org"],
        },
    },
    blockExplorers: {
        default: {
            name: "BaseScan",
            url: "https://base.blockscout.com/",
        },
    },
}) as Chain;

export const { chains, provider, webSocketProvider } = configureChains(
    [getTargetChain() as Chain],
    [
        alchemyProvider({
            apiKey: getAlchemyApiKey(),
            priority: 0,
        }),
        publicProvider({ priority: 1 }),
    ]
);

// Implement RainbowKit Connector: https://www.rainbowkit.com/docs/connect-button
// @dev: implement WalletConnect V2 require support via ProjectId: https://www.rainbowkit.com/docs/migration-guide#012x-breaking-changes:~:text=0.12.x%20Breaking%20changes
const { wallets } = getDefaultWallets({
    appName: WILDCARD_APP_NAME,
    projectId: getWalletConnectProjectId(),
    chains,
});

const connectors = connectorsForWallets([
    ...wallets,
    {
        groupName: "Other",
        wallets: [phantomWallet({ chains })],
    },
]);

export const wagmiClient = createClient({
    autoConnect: true,
    connectors,
    provider,
    webSocketProvider,
});

/**
 * Returns the target chain based on the network name specified in the target environment
 * @returns the target chain
 */
export function getTargetChain() {
    const environment = getEnvironment();
    switch (environment) {
        case "test":
            // return polygonMumbai;
            return base; // test to point to polygon mainnet for playtest
        case "prod":
            return base;
        case "local":
            return base; // uses chain id: 31337
        case "conduit":
            return conduit; // uses chain id: 15933
        default:
            return localhost; // uses chain id: 1337
    }
}

export function onExpectedChain(wagmiNetwork: Chain | undefined) {
    if (!wagmiNetwork) {
        return false;
    }
    return wagmiNetwork.network === getTargetChain().network;
}
