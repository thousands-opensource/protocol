import { useEffect, useRef } from 'react';
import { useEmotesStore } from '../store/useEmotesStore';

export const useEmoteSource = (id: string) => {
    const ref = useRef<HTMLElement>(null);
    const { addSourceRef, removeSourceRef } = useEmotesStore();

    useEffect(() => {
        addSourceRef(id, ref);
        return () => removeSourceRef(id);
    }, [id, addSourceRef, removeSourceRef]);

    return ref;
};