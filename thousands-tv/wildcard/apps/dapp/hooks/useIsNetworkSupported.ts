import { useState, useEffect } from "react";
import { useNetwork, useAccount } from "wagmi";
import { getTargetChain, onExpectedChain } from "../utils/wagmi";

interface SupportedNetworks {
    isNetworkSupported: boolean;
    reason: string;
}

export function useIsNetworkSupported() {
    const { chain } = useNetwork();
    const { address } = useAccount();
    const targetChainNetwork = getTargetChain();
    const isExpectedChainNetwork = onExpectedChain(chain);

    // logic is network supported
    const [isNetworkSupported, setIsNetworkSupported] =
        useState<SupportedNetworks>({
            isNetworkSupported: false,
            reason: "Connect your Wallet",
        });

    useEffect(() => {
        // check if wallet is connected
        if (!chain && !address) {
            return;
        }

        // Default to testnet Mumbai, Else use localhost (if dev mode is enabled)
        if (address && isExpectedChainNetwork) {
            return setIsNetworkSupported({
                isNetworkSupported: true,
                reason: "",
            });
        }

        // catch all unsupported networks
        setIsNetworkSupported({
            isNetworkSupported: false,
            reason: `Network not supported, Switch to ${targetChainNetwork}`,
        });
    }, [address, chain, isExpectedChainNetwork, targetChainNetwork]);

    return {
        isNetworkSupported: isNetworkSupported.isNetworkSupported,
        reason: isNetworkSupported.reason,
    };
}
