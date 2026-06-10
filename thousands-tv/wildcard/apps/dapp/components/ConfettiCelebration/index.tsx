import { useState, useEffect } from "react";
import Confetti from "react-confetti";

interface ConfettiCelebrationProps {
    duration?: number;
    colors?: string[];
}

/**
 * Confetti celebration component
 */
const ConfettiCelebration: React.FC<ConfettiCelebrationProps> = ({
    duration = 3000,
    colors = ["#ff5959", "#ffbb00", "#37b24d", "#1c7ed6"],
}) => {
    const [confettiVisible, setConfettiVisible] = useState(false);

    useEffect(() => {
        setConfettiVisible(true);
        const timer = setTimeout(() => {
            setConfettiVisible(false);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    return (
        <>
            {confettiVisible && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        zIndex: 9999,
                    }}
                >
                    <Confetti
                        width={window.innerWidth}
                        height={window.innerHeight}
                        numberOfPieces={200}
                        recycle={false}
                        gravity={0.3}
                        colors={colors}
                    />
                </div>
            )}
        </>
    );
};

export default ConfettiCelebration;
