import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useEmotesStore } from '@/store/useEmotesStore';
import { EmoteAnimation } from './EmoteAnimation';
import { useBreakpointValue } from '@chakra-ui/react';

const floatUpAnimation = `
  @keyframes emote-float-up {
    0% {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
    100% {
      transform: translateY(-200px) scale(1.2);
      opacity: 0;
    }
  }

  @keyframes emote-explode {
    0% {
        opacity: 0;
        transform: scale(0.2) rotate(0deg);
    }
    20% {
        opacity: 1;
        transform: scale(1.2) rotate(10deg);
    }
    60% {
        opacity: 1;
        transform: scale(1) rotate(-5deg);
    }
    100% {
        opacity: 0;
        transform: scale(1.5) rotate(0deg);
 
`;

export const AnimatedEmotes = () => {
  const isMobile = useBreakpointValue({ base: true, lg: false });

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = floatUpAnimation;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const { activeEmotes, clearEmote } = useEmotesStore();

  return createPortal(
    <>
      {
        activeEmotes.map((emoteData) => (
          <EmoteAnimation
            key={emoteData.id}
            emoteData={emoteData}
            onComplete={() => clearEmote(emoteData.id)}
          />
        ))}
    </>,
    document.body
  );
};