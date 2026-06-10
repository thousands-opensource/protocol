import { motion, AnimatePresence } from "framer-motion";
import { CreditTransactionStatus } from "@repo/interfaces";
import ConfettiCelebration from "@/components/ConfettiCelebration";

interface TransactionCompletionModalProps {
    isVisible: boolean;
    onClose: () => void;
    setStatus: (status: CreditTransactionStatus) => void;
}

/**
 * Modal component that displays when a credit purchase transaction is completed.
 * @dev - features a success animation, confetti celebration, and confirmation message.
 */
const TransactionCompletionModal = ({
    isVisible,
    onClose,
    setStatus,
}: TransactionCompletionModalProps) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Dark overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                        style={{ zIndex: 9998 }}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{
                            type: "spring",
                            damping: 20,
                            stiffness: 300,
                        }}
                        className="fixed inset-0 flex items-center justify-center"
                        style={{ zIndex: 9999 }}
                    >
                        <div className="w-full max-w-md ">
                            <div className="relative flex flex-col overflow-hidden rounded-xl border-2 border-[#30A46C] bg-[#131418]">
                                {/* Confetti celebration */}
                                <ConfettiCelebration
                                    colors={[
                                        "#ff5959",
                                        "#ffbb00",
                                        "#37b24d",
                                        "#1c7ed6",
                                    ]}
                                />

                                {/* Top gradient section */}
                                <div className="relative px-6 py-16 bg-gradient-to-br from-sky-500 to-blue-700">
                                    {/* SVG texture overlay */}
                                    <div
                                        className="absolute inset-0 bg-[url('/images/limited-credit-offers/shimmer.svg')] bg-no-repeat opacity-30 pointer-events-none"
                                        style={{ backgroundSize: "100% auto" }}
                                    />

                                    {/* Content above overlay */}
                                    <div className="relative flex flex-col items-center gap-4 py-4">
                                        <motion.div
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                            className="text-center"
                                        >
                                            <h4 className="text-2xl font-bold text-white">
                                                Transaction Completed!
                                            </h4>
                                            <p className="text-white/80 mt-2">
                                                Your credits have been added to
                                                your account
                                            </p>
                                        </motion.div>
                                    </div>
                                </div>

                                {/* Bottom section with frosted effect */}
                                <div className="backdrop-blur-sm bg-white/15 px-6 py-4 border-t border-white/10">
                                    <button
                                        onClick={() => {
                                            onClose();
                                            setStatus(
                                                CreditTransactionStatus.NONE
                                            );
                                        }}
                                        className="w-full px-6 py-3 bg-gradient-to-br from-sky-500 to-blue-700 
                                                   text-white font-semibold rounded-lg hover:opacity-90 
                                                   transition-opacity duration-200"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default TransactionCompletionModal;
