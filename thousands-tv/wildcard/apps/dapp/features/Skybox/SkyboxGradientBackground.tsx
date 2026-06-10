import React from "react";
import { SkyboxColor, useSkyboxStore } from "@/store/useSkyboxStore";

interface SkyboxGradientBackgroundProps {
    size?: "small" | "medium" | "large" | "extra-large";
    opacity?: number;
    position?:
        | "bottom-right"
        | "bottom-left"
        | "top-right"
        | "top-left"
        | "center";
    blur?: number;
    animationDuration?: number;
    useSelectedColor?: boolean;
}

export const SkyboxGradientBackground: React.FC<
    SkyboxGradientBackgroundProps
> = ({
    size = "large",
    opacity = 0.35,
    position = "bottom-right",
    blur = 150,
    animationDuration = 700,
    useSelectedColor = true,
}) => {
    const { selectedColor, activeColor } = useSkyboxStore();
    const color = useSelectedColor ? selectedColor : activeColor;

    if (!color) return null;

    const sizeClasses = {
        small: "w-[400px] h-[400px]",
        medium: "w-[600px] h-[600px]",
        large: "w-[800px] h-[800px]",
        "extra-large": "w-[1000px] h-[1000px]",
    };

    const positionClasses = {
        "bottom-right": "-bottom-80 -right-80",
        "bottom-left": "-bottom-80 -left-80",
        "top-right": "-top-80 -right-80",
        "top-left": "-top-80 -left-80",
        center: "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
    };

    return (
        <div
            className={`absolute ${positionClasses[position]} ${sizeClasses[size]} rounded-full pointer-events-none z-0 transition-colors`}
            style={{
                backgroundColor: color.color,
                opacity: opacity,
                filter: `blur(${blur}px)`,
                transitionDuration: `${animationDuration}ms`,
            }}
        />
    );
};

export default SkyboxGradientBackground;
