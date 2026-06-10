import Image from "next/image";
import { useCountdown } from "@/hooks/credits/useCountdownTimer";

interface LimitedOfferCardProps {
    offer: {
        credits: number;
        price: number;
        color: string;
        borderColor: string;
        endDate: string;
    };
    onSelect: (offer: any) => void;
}

/**
 * Limited time offer card component
 */
const LimitedOfferCard = ({ offer, onSelect }: LimitedOfferCardProps) => {
    const timeRemaining = useCountdown(offer.endDate);

    if (timeRemaining === "Expired") return null;

    return (
        <div
            className={`relative p-3 sm:p-6 rounded-lg bg-gradient-to-r ${offer.color} border-2 ${offer.borderColor} cursor-pointer hover:opacity-90`}
            onClick={() =>
                onSelect({
                    credits: offer.credits,
                    price: offer.price,
                    color: `bg-gradient-to-br ${offer.color}`,
                })
            }
        >
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 sm:gap-4">
                    <span className="text-2xl sm:text-4xl font-bold text-white">
                        {offer.credits >= 1000
                            ? `${offer.credits / 1000}K`
                            : offer.credits}
                    </span>
                    <Image
                        src="/images/Credits/coin-large.webp"
                        alt="C"
                        className="w-8 h-8 sm:w-12 sm:h-12 rounded-full opacity-90"
                        width={48}
                        height={48}
                    />
                </div>
                <button className="px-3 sm:px-6 py-1 sm:py-2 text-xs sm:text-sm font-semibold bg-blue-600 rounded-md text-white hover:bg-blue-700">
                    ${offer.price}
                </button>
            </div>
            <div className="mt-2 flex justify-start">
                <div className="text-xs sm:text-sm text-white/80 bg-black/50 rounded-full px-2 sm:px-3 py-1 inline-block min-w-[150px] sm:min-w-[200px] text-center">
                    Ends: {timeRemaining}
                </div>
            </div>
        </div>
    );
};

export default LimitedOfferCard;
