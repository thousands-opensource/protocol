import React, { useEffect, useState } from 'react';
import type { EmoteAnimation as EmoteAnimationType } from '@/store/useEmotesStore';
import { useBreakpointValue } from '@chakra-ui/react';

type EmoteAnimationProps = {
    emoteData: EmoteAnimationType;
    onComplete: () => void;
}

export const EmoteAnimation = ({ emoteData, onComplete }: EmoteAnimationProps) => {
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
    const isMobile = useBreakpointValue({ base: true, lg: false });

    useEffect(() => {
        if (!emoteData.sourceRef.current || position !== null) return;

        const rect = emoteData.sourceRef.current.getBoundingClientRect();
        const randomOffset = (Math.random() * 0.6 - 0.2) * rect.width;

        setPosition({
            top: rect.top + window.scrollY - (isMobile ? 0 : 20),
            left: rect.left + randomOffset
        });

        const duration = 1000 + Math.random() * 1000; // 1-2 seconds
        const timer = setTimeout(onComplete, duration);

        return () => clearTimeout(timer);
    }, [emoteData, onComplete]);

    if (!position) return null;

    return (
        <div
            className="fixed pointer-events-none z-5"
            style={{
                top: position.top,
                left: position.left,
                animation: isMobile
                    ? `emote-float-up ${1.5}s ease-out forwards`
                    : `emote-explode ${2}s cubic-bezier(0.22, 1, 0.36, 1) forwards`,
            }}
        >
            <div
                className="text-2xl lg:text-4xl"
                style={{
                    filter: !isMobile ? 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' : undefined
                }}
            >
                {emoteData.emote}
            </div>
        </div>
    );
};