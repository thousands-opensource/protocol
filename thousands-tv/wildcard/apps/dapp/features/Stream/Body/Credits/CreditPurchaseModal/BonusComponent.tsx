import React from "react";
import Image from "next/image";

interface BonusComponentProps {
    credits: number;
    onClaim: () => void;
}

/**
 * Component for displaying bonus credits
 */
const BonusComponent = ({ credits = 2000, onClaim }: BonusComponentProps) => {
    return (
        <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white">Bonus</h2>
            <p className="text-gray-400 text-lg">
                Lorem ipsum dolor sit amet, consectetuer adipiscing elit.
            </p>

            <div className="mt-4 relative">
                <div className="rounded-3xl border-4 bg-gradient-to-r from-emerald-400/90 to-cyan-500/90 overflow-hidden flex flex-col">
                    <div className="bg-gradient-to-r from-emerald-400/90 to-cyan-500/90 p-8 rounded-t-3xl">
                        <div className="flex items-center justify-center gap-4">
                            <span className="text-5xl font-bold text-white flex items-center">
                                {credits}
                            </span>
                            <Image
                                src="/images/Credits/coin-large.webp"
                                alt="Coin"
                                className="w-14 h-14"
                                width={56}
                                height={56}
                            />
                        </div>
                    </div>

                    {/* Claim button section */}
                    <div className="bg-[#1A1B1F] p-4 flex justify-center border  rounded-lg">
                        <div
                            onClick={onClaim}
                            className="bg-blue-600 py-2 px-4 text-center text-white font-bold text-lg uppercase cursor-pointer hover:bg-blue-700 transition-colors duration-200 rounded-3xl"
                        >
                            Claim
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BonusComponent;
