import { useEffect, useRef, useState, useMemo } from 'react';

export const useTextOverflow = (text: string, containerWidth: number) => {
    const measureRef = useRef<HTMLSpanElement>(null);
    const [splitIndex, setSplitIndex] = useState<number>(0);

    useEffect(() => {
        if (!measureRef.current || !text) return;

        const measure = (str: string) => {
            const span = measureRef.current;
            if (!span) return 0;
            span.textContent = str;
            return span.offsetWidth;
        };

        // If the entire text fits, use it all in the first line
        if (measure(text) <= containerWidth) {
            setSplitIndex(text.length);
            return;
        }

        // Split at word boundaries
        const words = text.split(/(\s+)/);
        let currentLine = '';
        let lastGoodIndex = 0;

        // if the first word is too long, just put it on the second line
        if (measure(words[0]) > containerWidth) {
            setSplitIndex(0);
            return;
        }

        for (let i = 0; i < words.length; i++) {
            const testLine = currentLine + words[i];
            if (measure(testLine) <= containerWidth) {
                currentLine = testLine;
                lastGoodIndex += words[i].length;
            } else {
                break;
            }
        }

        setSplitIndex(lastGoodIndex || words[0]?.length || text.length);
    }, [text, containerWidth]);

    const { firstLine, remainingText } = useMemo(() => {
        if (!text) {
            return { firstLine: "", remainingText: "" };
        }

        return {
            firstLine: text.slice(0, splitIndex),
            remainingText: text.slice(splitIndex)
        };
    }, [text, splitIndex]);

    return {
        measureRef,
        firstLine,
        remainingText
    };
};