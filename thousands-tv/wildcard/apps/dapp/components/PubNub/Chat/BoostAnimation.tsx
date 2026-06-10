import React, {
    useEffect,
    useCallback,
    useState,
    forwardRef,
    useImperativeHandle,
    useRef,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ActiveBoost, useBoostStore } from "@/store/useBoostStore";
import Silhoutte from "@/public/images/WildfileAssets/silhoutte.webp";

const floatUpAnimation = `
  @keyframes float-up {
    0% {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
    100% {
      transform: translateY(-400px) scale(1.2);
      opacity: 0;
    }
  }
`;

interface BoostAnimationsProps {
    className?: string;
    // Optionally, pass a ref to the container element where the overlay should be rendered.
    containerRef?: React.RefObject<HTMLElement>;
}

interface Reaction {
    id: number;
    imageUrl: string;
    borderColor: string;
    username: string;
    left: number;
    scale: number;
    delay: number;
    duration: number;
    avatarSize: number;
}

export interface BoostAnimationsRef {
    triggerReactionAnimation: (
        boostData: ActiveBoost,
        count?: number,
        skipDelay?: boolean
    ) => void;
}

const MAX_REACTIONS = 20; // max number of reactions on screen
const MAX_BOOSTS_PER_CYCLE = 5; // max number of boosts to process per cycle (prevents UI overload)

/**
 * Boost animation component logic (creates a gmeet-reaction UI like boost animation)
 * @dev - use a processing lock to prevent recursion and overloading the UI
 */
const BoostAnimations = forwardRef<BoostAnimationsRef, BoostAnimationsProps>(
    ({ className = "", containerRef }, ref) => {
        const [reactions, setReactions] = useState<Reaction[]>([]);
        const { activeBoosts, clearAllBoosts } = useBoostStore();

        // processing lock to track whether a boost is being processed
        const isProcessingRef = useRef(false);

        useImperativeHandle(ref, () => ({
            triggerReactionAnimation: createReactions,
        }));

        // Inject keyframe styles on mount.
        useEffect(() => {
            const styleElement = document.createElement("style");
            styleElement.textContent = floatUpAnimation;
            document.head.appendChild(styleElement);
            return () => {
                document.head.removeChild(styleElement);
            };
        }, []);

        const createReactions = useCallback(
            (boostData: ActiveBoost, count = 1, skipDelay = false) => {
                try {
                    // Limit the number of reactions based on current count
                    if (reactions.length >= MAX_REACTIONS) {
                        console.log("Maximum reactions reached, skipping...");
                        return;
                    }

                    // note: limit the number of reactions per cycle
                    const reactionCount = Math.min(
                        count,
                        MAX_REACTIONS - reactions.length
                    );

                    for (let i = 0; i < reactionCount; i++) {
                        const id = Math.random();
                        const basePosition =
                            (boostData.boostType === "red" ? 5 : 55) +
                            Math.random() * 40;
                        const leftPosition = Math.max(
                            5,
                            Math.min(95, basePosition)
                        );

                        const boostLevel = Math.min(
                            boostData.boostLevel || 1,
                            4
                        );
                        const avatarScale = 1 + (boostLevel - 1) * 0.15;
                        const avatarSize = Math.round(40 * avatarScale);

                        const reactionDelay = skipDelay
                            ? 0
                            : 0.1 + Math.random() * 2900;
                        const moveDuration = boostLevel * 0.2 + 1.5;

                        const baseScale =
                            0.8 + Math.sin(i * (Math.PI / reactionCount)) * 0.3;
                        const reactionScale = baseScale * avatarScale;

                        const reaction: Reaction = {
                            id,
                            imageUrl:
                                boostData.pfpUrl?.length > 0
                                    ? boostData.pfpUrl
                                    : Silhoutte.src,
                            borderColor: boostData.borderColor,
                            username: boostData.userName,
                            left: leftPosition,
                            scale: reactionScale,
                            delay: reactionDelay,
                            duration: moveDuration,
                            avatarSize,
                        };

                        setTimeout(() => {
                            setReactions((prev) => {
                                if (prev.length >= MAX_REACTIONS) return prev;
                                return [...prev, reaction];
                            });
                            setTimeout(() => {
                                setReactions((prev) =>
                                    prev.filter((r) => r.id !== reaction.id)
                                );
                            }, reactionDelay + moveDuration * 1000);
                        }, reactionDelay);
                    }
                } catch (error) {
                    console.warn("Error in createReactions:", error);
                }
            },
            [reactions.length]
        );

        useEffect(() => {
            try {
                // Skip if no boosts or already processing
                if (activeBoosts.length < 1 || isProcessingRef.current) return;

                // Set processing flag to prevent recursion
                isProcessingRef.current = true;

                try {
                    // Only process a limited number of boosts per cycle to avoid UI overload
                    const boostsToProcess = activeBoosts.slice(
                        0,
                        MAX_BOOSTS_PER_CYCLE
                    );

                    // Process the boosts
                    boostsToProcess.forEach((boost) => {
                        createReactions(boost, 1);
                    });

                    // Clear all boosts after processing
                    clearAllBoosts();
                } finally {
                    // Reset the processing flag after a short delay - This prevents immediate re-processing while allowing new boosts to be processed later
                    setTimeout(() => {
                        isProcessingRef.current = false;
                    }, 500);
                }
            } catch (outerError) {
                console.warn("Error in activeBoosts effect:", outerError);
                isProcessingRef.current = false;
            }
        }, [activeBoosts]);

        const overlay = (
            <div
                className={`pointer-events-none absolute inset-0 overflow-visible ${className}`}
            >
                {/* Animation overlay */}
                <div className="absolute inset-0 z-50">
                    {reactions.map((reaction) => (
                        <div
                            key={reaction.id}
                            className="absolute transition-all opacity-0"
                            style={{
                                left: `${reaction.left - 5}%`,
                                bottom: "0", // start at the bottom of the container
                                transform: `scale(${reaction.scale})`,
                                animation: `float-up ${reaction.duration}s ease-out forwards ${reaction.delay}ms`,
                            }}
                        >
                            <div className="flex flex-col items-center">
                                <div
                                    className="rounded-full p-0.5 shadow-lg"
                                    style={{
                                        width: reaction.avatarSize,
                                        height: reaction.avatarSize,
                                        background: reaction.borderColor,
                                        filter: "drop-shadow(0 0 8px rgba(0,0,0,0.3))",
                                    }}
                                >
                                    <Image
                                        src={reaction.imageUrl}
                                        alt={reaction.username}
                                        className="w-full h-full rounded-full object-cover"
                                        width={reaction.avatarSize}
                                        height={reaction.avatarSize}
                                    />
                                </div>
                                <div className="text-sm text-blue-300 bg-blue-300/20 backdrop-blur-sm px-2 py-0.5 rounded-full mt-1 text-center shadow-lg">
                                    {reaction.username}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );

        if (containerRef?.current) {
            return createPortal(overlay, containerRef.current);
        }
        return overlay;
    }
);

BoostAnimations.displayName = "BoostAnimations";

export default BoostAnimations;
