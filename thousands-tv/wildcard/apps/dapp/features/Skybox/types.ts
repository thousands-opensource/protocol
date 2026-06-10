export interface SkyboxSlot {
    id: number;
    occupied: boolean;
    name?: string;
    color?: string;
    avatar?: string;
}

export interface SkyboxColor {
    id: number;
    name: string;
    displayName: string;
    color: string;
}

export interface SkyboxMember {
    id: number;
    username: string;
    timestamp: string;
    message: string;
    avatar: string;
}

export interface SkyboxFan {
    id: string;
    name: string;
    pfpUrl: string;
    skyboxId?: string;
}

export const skyboxTierToMembership: { [skyboxTier: number]: number } = {
    1: 4,
    2: 10,
    3: 20,
};
