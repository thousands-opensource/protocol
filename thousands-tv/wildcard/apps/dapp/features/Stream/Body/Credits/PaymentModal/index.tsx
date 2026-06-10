import Image from "next/image";
import { useState } from "react";
import { createThirdwebClient } from "thirdweb";
import {
    ConnectButton,
    getDefaultToken,
    PayEmbed,
    useActiveWallet,
    useDisconnect,
} from "thirdweb/react";
import { base, sepolia } from "thirdweb/chains";
import { FiLogOut } from "react-icons/fi";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { getThirdWebClientId, getThirdWebPayEmbedChain, getThirdWebPayEmbedToken } from "@/utils/environmentUtil";
import { CreditOption } from "../contants";

const thirdClientId = getThirdWebClientId();
const thirdWebPayEmbedChain = getThirdWebPayEmbedChain();
const thirdWebPayEmbedToken = getThirdWebPayEmbedToken();

export const thirdWebClient = createThirdwebClient({
    clientId: thirdClientId,
});

export interface TokenParams {
    tokenId: number;
    priceMatic: number;
}

interface WildpassMetadata {
    name: string;
    description: string;
    image: string;
    attributes: Array<{
        trait_type: string;
        value: string;
    }>;
}

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedOption: CreditOption | null;
}

/**
 * Payment modal component for purchasing credits via thirdweb
 * @returns
 */
const PaymentModal = ({
    isOpen,
    onClose,
    selectedOption,
}: PaymentModalProps) => {
    const [metadata, setMetadata] = useState<WildpassMetadata | null>(null);
    const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
    const { userDB } = useWildfileUserContext();

    const [transactionStatus, setTransactionStatus] = useState<
        "idle" | "loading" | "success" | "error"
    >("idle");

    const THOUSANDS_PAYEE_ADDRESS =
        "0xEb0effdFB4dC5b3d5d3aC6ce29F3ED213E95d675";

    const { disconnect } = useDisconnect();
    const wallet = useActiveWallet();

    const handleOnClose = () => {
        onClose();
        setTransactionStatus("idle");
        setIsPurchasing(false);
    };

    if (!isOpen) return;

    if (!selectedOption || !userDB) return null;

    return (
        <>
            <div className="fixed inset-0 z-[99] flex items-center justify-center overflow-y-auto">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={handleOnClose}
                />

                {/* Modal Content */}
                <div className="relative z-[10] w-full max-w-2xl mx-4 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-[#383838]">
                    {/* Header */}
                    <div className="flex items-center justify-between p-2 border-b border-[#383838]">
                        <div className="flex items-center gap-4">
                            <Image
                                src={
                                    metadata?.image ||
                                    "/images/ServerNavigation/thousandsservercircle.svg"
                                }
                                width={10}
                                height={10}
                                alt={metadata?.name || ""}
                                className="w-10 h-10 rounded-lg object-cover border-2 border-purple-500"
                            />
                            <div>
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                    {metadata?.name}
                                </h2>
                                <p className="text-gray-400 text-sm mt-1 max-w-md">
                                    {metadata?.description}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleOnClose}
                            className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-[#383838]"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Purchase Interface */}
                    <div className="p-8">
                        <div className="min-h-[400px] flex items-center justify-center">
                            <div className="w-full max-w-md bg-[#1C1E27] p-3 rounded-xl shadow-lg border border-[#383838]">
                                {!wallet ? (
                                    <div className="flex flex-col justify-between items-center mb-2">
                                        <div className="text-white text-center p-4 max-w-full">
                                            <p className="whitespace-normal break-words">
                                                Please connect your wallet to
                                                continue purchase
                                            </p>
                                        </div>
                                        <ConnectButton
                                            client={thirdWebClient}
                                            detailsModal={{
                                                payOptions: {
                                                    buyWithFiat: {
                                                        testMode: true,
                                                    },
                                                    purchaseData: {
                                                        userId: userDB._id,
                                                    },
                                                },
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="text-white text-center">
                                            <div className="flex justify-between items-center mb-2">
                                                <button
                                                    className="flex items-center gap-2 text-red-500 hover:text-red-700"
                                                    onClick={() =>
                                                        wallet
                                                            ? disconnect(wallet)
                                                            : () => { }
                                                    }
                                                >
                                                    <FiLogOut
                                                        className="w-5 h-5"
                                                        color={"orange"}
                                                    />
                                                </button>
                                            </div>
                                            <ConnectButton
                                                client={thirdWebClient}
                                                detailsModal={{
                                                    payOptions: {
                                                        buyWithFiat: {
                                                            testMode: true,
                                                        },
                                                    },
                                                }}
                                            />
                                        </div>

                                        <div className="flex justify-center items-center mb-2">
                                            {selectedOption !== null && (
                                                <div className="mt-6 p-4 bg-[#1C1E27] rounded-xl border border-[#383838]">
                                                    <PayEmbed
                                                        client={thirdWebClient}
                                                        theme="dark"
                                                        payOptions={{
                                                            mode: "direct_payment",
                                                            paymentInfo: {
                                                                amount: selectedOption.price.toString(),
                                                                chain: (thirdWebPayEmbedChain === "sepolia" ? sepolia : base),
                                                                token: getDefaultToken(
                                                                    (thirdWebPayEmbedChain === "sepolia" ? sepolia : base),
                                                                    (thirdWebPayEmbedToken === "WETH" ? "WETH" : "USDC")
                                                                ),
                                                                sellerAddress:
                                                                    THOUSANDS_PAYEE_ADDRESS,
                                                                feePayer: "receiver"
                                                            },
                                                            metadata: {
                                                                // userId: userDB._id?.toString(), // pass user id on purchase flow
                                                                name: selectedOption.name,
                                                                image: selectedOption.image,
                                                            },
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {transactionStatus === "error" ? (
                                            <div className="space-y-4">
                                                <div className="text-red-500 text-center p-4">
                                                    Transaction failed. Please
                                                    try again.
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setTransactionStatus(
                                                            "idle"
                                                        );
                                                        setIsPurchasing(false);
                                                    }}
                                                    className="w-full px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                                                >
                                                    Retry Purchase
                                                </button>
                                            </div>
                                        ) : (
                                            <></>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PaymentModal;

