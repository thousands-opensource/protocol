import React, { memo, useState } from "react";
import { Text, Spinner, Image } from "@chakra-ui/react";
import useCreditBalance from "@/hooks/credits/useCreditBalance";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { IUser } from "@repo/interfaces";

interface CreditBalanceHeaderProps {
    userId: string | null;
    userDB: IUser | null;
}

/**
 * Credit balance display component
 */
const CreditBalanceHeader: React.FC<CreditBalanceHeaderProps> = memo(
    ({ userId, userDB }) => {
        const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
        const { creditBalanceObj, loading, error, fetchCreditBalance } =
            useCreditBalance(userId);
        const { creditBalance } = useWildfileUserContext();

        console.log("CreditBalanceHeader -> userDB", userDB);

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
            }

            if (error || !creditBalance) {
                return (
                    <div className="flex flex-col items-start">
                        <span className="text-sm text-gray-300">Guest</span>
                        <div className="flex items-center gap-2">
                            <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-500/50 to-yellow-300/50 outline-text">
                                0
                            </span>
                            <Image
                                src="/images/Credits/coin.webp"
                                alt="Credits"
                                className="w-6 h-6"
                            />
                        </div>
                    </div>
                );
            }

            return (
                <div className="flex flex-col items-start">
                    {/* Display Name */}
                    <span className="text-lg text-gray-300 font-extrabold uppercase">
                        {userDB?.preferences?.displayName || "User"}
                    </span>

                    {/* Credits Container */}
                    <div className="flex items-end gap-1">
                        {" "}
                        {/* Changed to items-end to align at bottom */}
                        <span
                            className="font-bold bg-clip-text text-transparent leading-none"
                            style={{
                                fontSize: "72px", // Use pixels for larger size
                                WebkitTextStroke: "1px rgba(255, 193, 7, 0.5)",
                            }}
                        >
                            {creditBalance}
                        </span>
                        <Image
                            src="/images/Credits/coin.webp"
                            alt="Credits"
                            className="w-6 h-6 mb-2" // Increased image size
                        />
                    </div>
                </div>
            );
        };

        return (
            <>
                <div className="flex justify-center">
                    <Text
                        // onClick={() => setIsModalOpen(true)}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                    >
                        {renderCreditBalance()}
                    </Text>
                </div>
                {/* <CreditsPurchaseModal
                    isOpen={isModalOpen}
                    onClose={handleOnClose}
                /> */}
            </>
        );
    }
);

CreditBalanceHeader.displayName = "CreditBalanceDisplay";

export default CreditBalanceHeader;
