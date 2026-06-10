import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useToast } from "@chakra-ui/react";
import { WildcardApiResponse } from "@repo/interfaces";
import { toastDefaultOptions } from "@/constants/constants";
import { useGlobalContext } from "@/contexts/globalContext";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { useAccount, useSignMessage } from "wagmi";

export interface UseLinkedWalletsReturn {
    linkedWallets: string[];
    addWallet: (wallet: string) => void;
    unlinkWallet: (wallet: string) => Promise<void>;
    linkWallet: () => Promise<void>;
    linkingInProgress: boolean;
    additionalWalletLinked: boolean;
    error: string;
    resetLinkingState: () => void;
}

export function useLinkedWallets(): UseLinkedWalletsReturn {
    const { userDB, setUserDB } = useWildfileUserContext();
    const initialWallets = useMemo(() => userDB?.walletProvider?.additionalWallets ?? [], [userDB]);

    const [linkedWallets, setLinkedWallets] = useState<string[]>(initialWallets);
    const toast = useToast();
    const { setLoadingSpinner } = useGlobalContext();
    const { signMessage: signLinkWalletMessage } = useSignMessage({
        onSuccess(data, variables) {
            callLinkWalletApi(data, variables.message as string);
        }
    });

    const [linkingInProgress, setLinkingInProgress] = useState(false);
    const [additionalWalletLinked, setAdditionalWalletLinked] = useState(false);
    const [error, setError] = useState("");

    const { address, isConnected } = useAccount();

    useEffect(() => {
        if (initialWallets) {
            setLinkedWallets(initialWallets);
        }
    }, [initialWallets]);

    const addWallet = (wallet: string): void => {
        setLinkedWallets((prev) => (prev ? [...prev, wallet] : [wallet]));
    };

    const removeWallet = (wallet: string): void => {
        setLinkedWallets((prev) => (prev ? prev.filter((addr) => addr !== wallet) : []));
    };

    const unlinkWallet = async (wallet: string): Promise<void> => {
        setLoadingSpinner(true);
        try {
            // Optimistically update UI
            removeWallet(wallet);

            const body = { addressToRemove: wallet };
            const resp = await axios.post("/api/unlinkWallet/", body);
            const unlinkResponse: WildcardApiResponse = resp.data;

            if (!unlinkResponse.success) {
                toast({
                    ...toastDefaultOptions,
                    description: unlinkResponse.err,
                    status: "warning",
                    duration: 5000,
                });
            } else {
                toast({
                    ...toastDefaultOptions,
                    description: `Successfully removed ${wallet} as a linked wallet`,
                    status: "success",
                    duration: 3000,
                });
                setUserDB(unlinkResponse?.data?.updatedUser);
                console.log('uunlink response?', unlinkResponse)
            }
        } catch (e) {
            toast({
                ...toastDefaultOptions,
                description: `There was a technical issue removing ${wallet} as a linked wallet`,
                status: "warning",
                duration: 5000,
            });
            console.error("Error unlinking wallet:", e);
        } finally {
            setLoadingSpinner(false);
        }
    };

    const linkWallet = async (): Promise<void> => {
        if (!isConnected || !address) {
            setError("Wallet not connected");
            return;
        }
        setLinkingInProgress(true);
        setError("");
        try {
            // Prepare message for signing
            const nonce = `${Date.now()}${Math.floor(Math.random() * 100000)}`;
            const message = `I am publicly revealing that this wallet is linked to my Thousands account. \nNonce: ${nonce}`;
            const signature = await signLinkWalletMessage({ message });
        } catch (e: any) {
            toast({
                ...toastDefaultOptions,
                description: `There was a technical issue linking your wallet. ${e?.message || ""}`,
                status: "warning",
                duration: 5000,
            });
            setError("There was a technical issue linking your wallet.");
            console.error("Error linking wallet:", e);
        } finally {
            setLinkingInProgress(false);
        }
    };

    const callLinkWalletApi = async (signature: string, message: string): Promise<void> => {
        if (!address) return

        const body = { signature, message, address };
        const resp = await axios.post("/api/linkAdditionalWallet/", body);
        const linkResponse: WildcardApiResponse = resp.data;

        if (!linkResponse.success) {
            toast({
                ...toastDefaultOptions,
                description: linkResponse.err,
                status: "warning",
                duration: 5000,
            });
            setError(linkResponse.err ?? "Error Linking wallet");
        } else {
            toast({
                ...toastDefaultOptions,
                description: `Successfully linked wallet ${address}`,
                status: "success",
                duration: 3000,
            });
            // Update local state with the new wallet
            addWallet(address);
            setUserDB(linkResponse?.data?.updatedUser);
            setAdditionalWalletLinked(true);
        }
    }

    const resetLinkingState = () => {
        setAdditionalWalletLinked(false);
        setError("");
    };

    return {
        linkedWallets,
        addWallet,
        unlinkWallet,
        linkWallet,
        linkingInProgress,
        additionalWalletLinked,
        error,
        resetLinkingState,
    };
}
