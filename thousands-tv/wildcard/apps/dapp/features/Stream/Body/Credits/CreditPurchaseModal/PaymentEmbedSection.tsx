import { useMemo } from "react";
import { createThirdwebClient } from "thirdweb";
import { PayEmbed, TokenInfo, getDefaultToken } from "thirdweb/react";
import { base, sepolia } from "thirdweb/chains";
import {
    getThirdWebClientId,
    getThirdWebPayEmbedChain,
    getThousandsPayeeAddress,
    getThirdWebPayEmbedToken,
} from "@/utils/environmentUtil";
import { CreditOption } from "../contants";
import { LimitedTimeDiscount } from "@/types";
import { calculateTotalCredits } from "@/utils/util";

interface PaymentEmbedSectionProps {
    selectedOption: CreditOption;
    userId: string;
    setTransactionId: (transactionId: string) => void;
    transactionId: string | null;
    isTransactionIdLoading?: boolean;
    transactionIdError?: string | null;
    onPurchaseSuccess?: () => void;
    bonusMap: Record<string, number>;
    sponsoredEventId?: string;
    sponsorshipSlotId?: string;
}
// address of the payee
const THOUSANDS_PAYEE_ADDRESS = getThousandsPayeeAddress();
const thirdWebPayEmbedChain = getThirdWebPayEmbedChain();
const thirdWebPayEmbedToken = getThirdWebPayEmbedToken();
const thirdClientId = getThirdWebClientId();

export const thirdWebClient = createThirdwebClient({
    clientId: thirdClientId,
});

/**
 * Payment embed section for the credit purchase modal
 */
const PaymentEmbedSection = ({
    selectedOption,
    userId,
    setTransactionId,
    transactionId,
    isTransactionIdLoading = false,
    transactionIdError = null,
    onPurchaseSuccess,
    bonusMap,
    sponsoredEventId,
    sponsorshipSlotId,
}: PaymentEmbedSectionProps) => {
    const creditsAmount = calculateTotalCredits(
        selectedOption.credits,
        bonusMap[selectedOption.id]
    );

    const creditsAmountStr = creditsAmount.toString();
    // Memoize the PayEmbed component to prevent unnecessary re-renders
    const memoizedPayEmbed = useMemo(() => {
        if (!selectedOption || !userId || !transactionId) {
            return null;
        }

        return (
            <PayEmbed
                client={thirdWebClient}
                theme="dark"
                payOptions={{
                    mode: "direct_payment",
                    buyWithFiat: false,
                    paymentInfo: {
                        amount: selectedOption.price.toString(),
                        chain: base,
                        token: getDefaultToken(base, "USDC"),
                        sellerAddress: THOUSANDS_PAYEE_ADDRESS,
                        feePayer: "receiver"
                    },
                    onPurchaseSuccess,
                    metadata: {
                        name:
                            selectedOption.name ||
                            `${creditsAmountStr} Credits Package`,
                        image:
                            selectedOption.image || "/images/wildcardpremierleague.png",                        
                    },
                    purchaseData: {
                        userId,
                        credits: creditsAmount,
                        transactionId: transactionId,
                        ...(sponsoredEventId
                            ? { sponsoredEventId }
                            : {}),
                        ...(sponsorshipSlotId
                            ? { sponsorshipSlotId }
                            : {}),
                    },
                }}
            />
        );
    }, [selectedOption, userId, transactionId]);

    // Early return checks
    if (!selectedOption) {
        return null;
    }

    if (!userId) {
        return null;
    }

    if (isTransactionIdLoading) {
        return null;
    }

    if (!transactionId) {
        if (!transactionIdError) {
            return null;
        }
        return (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-red-500">
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <span className="text-sm font-medium">
                        {transactionIdError || "Transaction ID not found"}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-6 p-4 flex items-center justify-center">
            {memoizedPayEmbed}
        </div>
    );
};

export default PaymentEmbedSection;
