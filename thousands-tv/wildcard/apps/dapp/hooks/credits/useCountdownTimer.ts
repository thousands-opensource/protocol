import { useEffect, useState } from "react";

/**
 * Countdown hook - Calculate time left until a given date
 * @note - used in the countdown timer for the credit purchase modal offers
 * @param endDate - The end date of the countdown
 * @returns
 */
export const useCountdown = (endDate: string) => {
    const [timeLeft, setTimeLeft] = useState<string>("");

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference =
                new Date(endDate).getTime() - new Date().getTime();

            if (difference <= 0) {
                return "Expired";
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);

            return `${days}d ${hours.toString().padStart(2, "0")}h ${minutes
                .toString()
                .padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            const timeRemaining = calculateTimeLeft();
            setTimeLeft(timeRemaining);

            if (timeRemaining === "Expired") {
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [endDate]);

    return timeLeft;
};
