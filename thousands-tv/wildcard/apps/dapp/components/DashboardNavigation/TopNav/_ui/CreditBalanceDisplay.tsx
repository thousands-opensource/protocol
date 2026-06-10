import React, { memo, useState } from "react";
import { Text, Spinner, Image, Box } from "@chakra-ui/react";
import useCreditBalance from "@/hooks/credits/useCreditBalance";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { poppinsBold } from "@/utils/themeUtil";

interface CreditBalanceDisplayProps {
    variant?: "sm" | "lg"
}

/**
 * Credit balance display component
 */

const CreditBalanceDisplay: React.FC<CreditBalanceDisplayProps> = memo(({
    variant = "sm"
}) => {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const { creditBalance, userDB } = useWildfileUserContext();
    const userId = userDB?._id?.toString() || null;
    const { creditBalanceObj, loading, error, fetchCreditBalance } =
        useCreditBalance(userId);

    /**
     * Handle close modal
     * refetch credit balance and close modal
     */
    const handleOnClose = async () => {
        try {
            if (!creditBalanceObj?.balance) {
                return;
            }
            if (fetchCreditBalance) {
                await fetchCreditBalance();
            }
            setIsModalOpen(false);
        } catch (error) {
            console.log(
                `Error updating UI credit balance state for user: ${userId}`
            );
        } finally {
            setIsModalOpen(false);
        }
    };
    const renderCreditBalance = () => {
        if (loading) {
            return <Spinner size="sm" />;
        } else if (error || !creditBalanceObj || !creditBalance) {
            return (
                <div className="flex items-center gap-1">
                    <span>0</span>
                    <Image
                        src="/images/Credits/coin.webp"
                        alt="Credits"
                        width={5}
                        height={5}
                        className="w-4 h-4"
                    />
                </div>
            );
        } else {
            return (
                <div className="flex items-center gap-1">
                    <span>{creditBalance}</span>
                    <Image
                        src="/images/Credits/coin.webp"
                        alt="Credits"
                        width={5}
                        height={5}
                        className="w-4 h-4"
                    />
                </div>
            );
        }
    };

    return (
        <>
            <Box
                className={`transition-opacity ${variant === "lg" ? 'text-[28pt] md:text-[34pt]' : ''} ${poppinsBold.className}`}
            >
                {renderCreditBalance()}
            </Box>
            {/* <CreditsPurchaseModal
                    isOpen={isModalOpen}
                    onClose={handleOnClose}
                /> */}
        </>
    );
});

CreditBalanceDisplay.displayName = "CreditBalanceDisplay";

export default CreditBalanceDisplay;
