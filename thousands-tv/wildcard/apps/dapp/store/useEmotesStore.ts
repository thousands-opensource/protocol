import { create } from 'zustand';

export type EmoteAnimation = {
    id: string;
    sourceRef: React.RefObject<HTMLElement>;
    emote: string;
};

type EmotesStore = {
    activeEmotes: EmoteAnimation[];
    sourceRefs: Map<string, React.RefObject<HTMLElement>>;
    addSourceRef: (id: string, ref: React.RefObject<HTMLElement>) => void;
    removeSourceRef: (id: string) => void;
    triggerEmote: (sourceId: string, emote: string) => void;
    clearEmote: (id: string) => void;
}

export const useEmotesStore = create<EmotesStore>((set, get) => ({
    activeEmotes: [],
    sourceRefs: new Map(),

    addSourceRef: (id, ref) => {
        set((state) => ({
            sourceRefs: new Map(state.sourceRefs).set(id, ref)
        }));
    },

    removeSourceRef: (id) => {
        set((state) => {
            const newRefs = new Map(state.sourceRefs);
            newRefs.delete(id);
            return { sourceRefs: newRefs };
        });
    },

    /**
    * Adds an emote to activeEmotes.  This starts playing the emote immediately.
    * @param {string} sourceId - The sourceRef name, which is a string in the format skybox-[skyboxId]
    * @param {string} emote - The unicode emote to add to activeEmotes
    */
    triggerEmote: (sourceId, emote) => {
        const sourceRef = get().sourceRefs.get(sourceId);
        if (!sourceRef) return;
        //console.log("triggerEmote", sourceRef);

        set((state) => ({
            activeEmotes: [
                ...state.activeEmotes,
                {
                    id: `${sourceId}-${Date.now()}-${Math.random()}`,
                    sourceRef,
                    emote
                }
            ]
        }));
    },

    clearEmote: (id) => {
        set((state) => ({
            activeEmotes: state.activeEmotes.filter(emote => emote.id !== id)
        }));
    }
}));