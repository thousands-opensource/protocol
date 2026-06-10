export interface Identity {
    id: string;
    name: string;
    description?: string;
    fanfareType: string;
    customMessage: string;
    avatarUrl?: string;
    emoji?: string;
    price?: number;
}

/**
 * List of identities
 */
export const identities: Identity[] = [
    {
        id: "1",
        name: "Foam Finger",
        description: "",
        emoji: "👆",
        price: 0.001,
        fanfareType: "foamfinger",
        customMessage: "Foam Finger",
    },
    {
        id: "2",
        name: "Fireworks",
        description: "",
        emoji: "🎉",
        price: 0.002,
        fanfareType: "fireworks",
        customMessage: "Fireworks",
    },
    {
        id: "3",
        name: "The Wave",
        description: "",
        emoji: "👋",
        price: 0.003,
        fanfareType: "thewave",
        customMessage: "Do the Wave",
    },
];
/**
 * Util to get identity by id
 * @param id
 * @returns
 */
export const getIdentityById = (id: string | null): Identity | null => {
    if (!id) return null;
    return identities.find((identity) => identity.id === id) || null;
};
