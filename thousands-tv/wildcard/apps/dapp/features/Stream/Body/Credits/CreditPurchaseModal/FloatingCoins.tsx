import React, { useState, useEffect } from "react";
import Image from "next/image";

interface FloatingCoinsProps {
    isActive?: boolean;
    size?: "sm" | "md" | "lg";
}

/**
 * Floating coins animation component
 */
const FloatingCoins = ({ isActive = false }: FloatingCoinsProps) => {
    const [coins, setCoins] = useState<
        Array<{
            id: string;
            offsetX: number;
            scale: number;
            duration: number;
        }>
    >([]);

    const createCoin = () => ({
        id: Math.random().toString(36).substr(2, 9),
        offsetX: Math.random() * 90 - 45,
        scale: 1.5 + Math.random(),
        duration: 2000 + Math.random() * 1000,
    });

    useEffect(() => {
        if (isActive) {
            setCoins([]);
            const initialCoinsInterval = setInterval(() => {
                setCoins((prev) => {
                    if (prev.length < 3) {
                        return [...prev, createCoin()];
                    }
                    return prev;
                });
            }, 100);

            const continuousInterval = setInterval(() => {
                setCoins((prev) => [...prev, createCoin()]);
            }, 200);

            return () => {
                clearInterval(initialCoinsInterval);
                clearInterval(continuousInterval);
                setCoins([]);
            };
        } else {
            setCoins([]);
        }
    }, [isActive]);

    /**
     * Remove coins after 2 seconds (fade out animation)
     */
    useEffect(() => {
        if (coins.length > 12) {
            const cleanup = setTimeout(() => {
                setCoins((prev) => prev.slice(1));
            }, 2000);
            return () => clearTimeout(cleanup);
        }
    }, [coins]);

    if (!isActive) return null;

    return (
        <div
            className="fixed left-1/2 transform -translate-x-1/2 w-96 h-60 pointer-events-none"
            style={{ bottom: "50%" }}
        >
            {coins.map((coin) => (
                <div
                    key={coin.id}
                    className="absolute animate-float opacity-0"
                    style={{
                        left: `calc(50% + ${coin.offsetX}px)`,
                        top: 80,
                        transform: `scale(${coin.scale})`,
                        animation: `float ${coin.duration}ms ease-out forwards`,
                        zIndex: 100,
                    }}
                >
                    <Image
                        src="/images/Credits/coin.webp"
                        alt="Coin"
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full opacity-90"
                    />
                </div>
            ))}
        </div>
    );
};

interface CoinIconProps {
    size?: "sm" | "md" | "lg";
    showAnimation?: boolean;
    className?: string;
}

const sizesMap = {
    sm: { size: "w-8 h-8", imgSize: 32 },
    md: { size: "w-12 h-12", imgSize: 48 },
    lg: { size: "w-16 h-16", imgSize: 64 },
};

/**
 * Coin icon component
 */
const CoinIcon = ({
    size = "md",
    showAnimation = true,
    className = "",
}: CoinIconProps) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="relative inline-flex items-center justify-center"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className={`
                    ${sizesMap[size].size}
                    flex items-center justify-center
                    cursor-pointer
                    transform transition-transform duration-200
                    hover:scale-105
                    ${className}
                `}
            >
                <Image
                    src="/images/Credits/coin.webp"
                    alt="Coin"
                    width={sizesMap[size].imgSize}
                    height={sizesMap[size].imgSize}
                    className="w-full h-full rounded-full opacity-90"
                />
            </div>
            {showAnimation && <FloatingCoins isActive={false} size={size} />}
        </div>
    );
};

export default CoinIcon;
