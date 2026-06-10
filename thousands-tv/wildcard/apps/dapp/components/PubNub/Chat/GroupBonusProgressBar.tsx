import { useBoostStore } from "@/store/useBoostStore";
import { poppinsRegular } from "@/utils/themeUtil";
import { FC } from "react";

interface GroupProgressBarProps {}

/**
 * Group Progress Bar - Component to display a progress bar with a level indicator
 */
const GroupBonusProgressBar: FC<GroupProgressBarProps> = ({}) => {
    // Ensure progress is between 0 and 100
    const { totalRedBoost, totalBlueBoost } = useBoostStore();

    const CREDITS_SPENT_PER_RALLY_LEVEL = 100000;

    const getRallyInfo = (totalPoints: number) => {
        const level = Math.min(
            10,
            Math.floor(totalPoints / CREDITS_SPENT_PER_RALLY_LEVEL) + 1
        );
        const pointsInCurrentLevel =
            totalPoints % CREDITS_SPENT_PER_RALLY_LEVEL;
        const progress =
            level === 10
                ? 100
                : (pointsInCurrentLevel / CREDITS_SPENT_PER_RALLY_LEVEL) * 100;
        return { level, progress };
    };

    const rallyLevel = getRallyInfo(totalRedBoost + totalBlueBoost).level;
    const rallyProgress = getRallyInfo(totalRedBoost + totalBlueBoost).progress;

    const validProgress = Math.min(Math.max(rallyProgress, 0), 100);

    // Get gradient based on level
    const getGradient = (level: number) => {
        const gradients: { [key: number]: string } = {
            1: "from-yellow-300 via-yellow-400 to-amber-500",
            2: "from-yellow-400 via-yellow-500 to-amber-600",
            3: "from-amber-400 via-amber-500 to-red-500",
            4: "from-red-400 via-pink-500 to-pink-600",
            5: "from-purple-500 via-purple-600 to-indigo-600",
            6: "from-purple-500 via-purple-600 to-indigo-600",
            7: "from-blue-400 via-blue-500 to-sky-500",
            8: "from-green-500 via-green-400 to-lime-400",
            9: "from-lime-400 via-lime-300 to-yellow-300",
            10: "from-yellow-300 via-yellow-200 to-yellow-100",
        };
        return gradients[level] || gradients[1];
    };

    const gradientClass = getGradient(rallyLevel);

    return (
        <div className="relative">
            <div className="relative w-[140px]  md:w-[88px] h-7 bg-[#7c7c7c] rounded-md border-2 border-[#222222]">
                <div
                    className={`absolute h-full left-0 bg-gradient-to-r ${gradientClass} rounded-md transition-all duration-700 ease-out`}
                    style={{
                        width: `${validProgress}%`,
                        borderRadius:
                            validProgress < 100
                                ? "0.375rem 0 0 0.375rem"
                                : "0.375rem", // rounded-md
                    }}
                />
                {/* Group Bonus text overlay */}
                <div className="absolute inset-0 flex items-center pl-2 z-5 mt-0.5">
                    <span
                        className={`text-black font-semibold text-[8px] ml-[-4.5px] ${poppinsRegular.className}`}
                        style={{
                            letterSpacing: "0.25px",
                        }}
                    >
                        Group Bonus
                    </span>
                </div>
                {/* Level circle with outer ring effect using the same gradient */}
                <div
                    className={`absolute flex items-center justify-center bg-gradient-to-r ${gradientClass} rounded-full border-2 border-black`}
                    style={{
                        width: "30px",
                        height: "30px",
                        right: "-5px",
                        top: "-3px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
                        zIndex: 10,
                    }}
                >
                    {/* Inner circle with level number */}
                    <div
                        className="flex items-center justify-center bg-black rounded-full"
                        style={{ width: "18px", height: "18px" }}
                    >
                        <span className="text-white font-bold text-md">
                            {rallyLevel}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupBonusProgressBar;
