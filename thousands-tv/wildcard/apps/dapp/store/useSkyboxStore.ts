import {
    MAX_SKYBOX_SLOT,
    TIER_MAX_MEMBERSHIP_MAP,
} from "@/constants/constants";
import { colorOptions } from "@/features/Skybox/exampleData";
import { SkyboxPurchaseOption } from "@/features/Skybox/SkyboxPurchaseModal";
import { SkyboxFan } from "@/features/Skybox/types";
import { ISkybox } from "@repo/interfaces";
import { create } from "zustand";
import { PubnubUser, useGetUsersStore } from "./useGetUsersStore";

export type SkyboxColor = {
    id: number;
    name: string;
    color: string;
    displayName: string;
};

export const generatePartialSkybox = (): Partial<ISkybox> => ({
    skyboxName: "",
    skyboxPrimaryColor: "",
    skyboxTier: 0,
    skyboxLogoUrl: "",
    skyboxChannelMembers: [],
});

export const generatePartialChannelMember = (): Partial<SkyboxFan> => ({
    name: "",
    pfpUrl: "",
});

interface SkyboxState {
    // The color that is currently applied/saved
    activeColor: SkyboxColor | null;
    // The color that is currently selected but not yet applied
    selectedColor: SkyboxColor | null;
    // All available color options
    colorOptions: SkyboxColor[];
    // Whether to show settings panel
    showSettings: boolean;
    // Whether to show the skybox UI
    showSkybox: boolean;
    selectedOption: SkyboxPurchaseOption | null;
    setSelectedOption: (selectedOption: SkyboxPurchaseOption | null) => void;
    skyboxInviteId: string;
    setSkyboxInviteId: (skyboxInviteId: string) => void;
    openSkyboxInviteModal: boolean;
    setOpenSkyboxInviteModal: (openSkyboxInviteModal: boolean) => void;
    skyboxInviteDetail: { skyboxName: string; skyboxOwner: SkyboxFan } | null;
    setSkyboxInviteDetail: (
        skyboxInviteDetail: {
            skyboxName: string;
            skyboxOwner: SkyboxFan;
        } | null
    ) => void;
    selectRemoveMember: SkyboxFan | null;
    setSelectRemoveMember: (selectRemoveMember: SkyboxFan | null) => void;
    skyboxes: ISkybox[];
    setSkyboxes: (skybox: ISkybox[]) => void;
    selectedSkybox: ISkybox | null;
    setSelectedSkybox: (selectedSkybox: ISkybox | null) => void;
    channelMembers: SkyboxFan[];
    setChannelMembers: (channelMember: SkyboxFan[]) => void;
    generalSkybox: ISkybox | null;
    setGeneralSkybox: (skybox: ISkybox | null) => void;
    isSkyboxesVisible: boolean;
    setIsSkyboxesVisible: (isSkyboxesVisible: boolean) => void;

    showInviteModal: boolean;
    setShowInviteModal: (show: boolean) => void;
    pendingInviteMember: SkyboxFan | null;
    setPendingInviteMember: (member: SkyboxFan | null) => void;

    // Actions
    setSelectedColor: (color: SkyboxColor) => void;
    applySelectedColor: () => void;
    resetSelectedColor: () => void;
    toggleSettings: (show?: boolean) => void;
    toggleSkybox: (show?: boolean) => void; // New toggle action for the entire Skybox
    populateChannelMembers: (users: PubnubUser[], skybox: ISkybox) => void;
}

export const useSkyboxStore = create<SkyboxState>((set) => ({
    // Initialize with default values
    activeColor: colorOptions[0],
    selectedColor: colorOptions[0],
    colorOptions: colorOptions,
    showSettings: false,
    showSkybox: false,
    selectedOption: null,
    setSelectedOption: (selectedOption: SkyboxPurchaseOption | null) =>
        set({ selectedOption }),

    skyboxInviteId: "",
    setSkyboxInviteId: (skyboxInviteId: string) => set({ skyboxInviteId }),
    openSkyboxInviteModal: false,
    setOpenSkyboxInviteModal: (openSkyboxInviteModal: boolean) =>
        set({ openSkyboxInviteModal }),
    selectRemoveMember: null,
    setSelectRemoveMember: (selectRemoveMember: SkyboxFan | null) =>
        set({ selectRemoveMember }),
    skyboxes: Array.from(
        { length: MAX_SKYBOX_SLOT },
        generatePartialSkybox
    ) as ISkybox[],
    setSkyboxes: (skyboxes: ISkybox[]) => {
        const updateUserSkyboxes =
            useGetUsersStore.getState().updateUserSkyboxes;

        skyboxes.forEach((skybox) => {
            if (
                skybox._id &&
                skybox.skyboxChannelMembers &&
                skybox.skyboxPrimaryColor
            ) {
                updateUserSkyboxes(
                    skybox.skyboxChannelMembers,
                    skybox._id.toString(),
                    skybox.skyboxPrimaryColor
                );
            }
        });
        set({ skyboxes });
    },
    selectedSkybox: null,
    setSelectedSkybox: (selectedSkybox: ISkybox | null) =>
        set({ selectedSkybox }),
    channelMembers: [],
    setChannelMembers: (channelMembers: SkyboxFan[]) => set({ channelMembers }),
    skyboxInviteDetail: null,
    setSkyboxInviteDetail: (
        skyboxInviteDetail: {
            skyboxName: string;
            skyboxOwner: SkyboxFan;
        } | null
    ) => {
        set({ skyboxInviteDetail });
    },
    generalSkybox: null,
    setGeneralSkybox: (generalSkybox: ISkybox | null) => {
        // @note initial set generalskybox as the selected skybox
        set({ generalSkybox, selectedSkybox: generalSkybox });
    },
    isSkyboxesVisible: false,
    setIsSkyboxesVisible: (isSkyboxesVisible: boolean) =>
        set({ isSkyboxesVisible }),

    showInviteModal: false,
    setShowInviteModal: (show: boolean) => set({ showInviteModal: show }),
    pendingInviteMember: null,
    setPendingInviteMember: (member: SkyboxFan | null) =>
        set({ pendingInviteMember: member }),

    // Set the selected color (without applying it)
    setSelectedColor: (color) => set(() => ({ selectedColor: color })),

    // Apply the selected color as the active color
    applySelectedColor: () =>
        set((state) => ({ activeColor: state.selectedColor })),

    // Reset selected color to match the active color (cancel selection)
    resetSelectedColor: () =>
        set((state) => ({ selectedColor: state.activeColor })),

    // Toggle settings panel visibility
    toggleSettings: (show) =>
        set((state) => ({
            showSettings: show !== undefined ? show : !state.showSettings,
        })),

    // Toggle skybox visibility
    toggleSkybox: (show) =>
        set((state) => ({
            showSkybox: show !== undefined ? show : !state.showSkybox,
            // When hiding the skybox, also hide settings
            showSettings: show === false ? false : state.showSettings,
        })),

    populateChannelMembers: (users: PubnubUser[], skybox: ISkybox) => {
        const updatedChannelMembers = skybox.skyboxChannelMembers.map(
            (channelMemberId: string) => {
                const channelMember = users.find(
                    (user) => channelMemberId === user.id
                );
                if (!channelMember) {
                    return {
                        id: channelMemberId,
                        name: "Anonymous",
                        pfpUrl: "https://www.thousands.tv/images/WildfileAssets/silhoutte.webp",
                    } as SkyboxFan;
                }
                return {
                    id: channelMember.id,
                    name: channelMember.name,
                    pfpUrl: channelMember.profileUrl,
                } as SkyboxFan;
            }
        ) as SkyboxFan[];
        const tier = skybox.skyboxTier;
        const emptyChannelMember = Array.from(
            {
                length:
                    TIER_MAX_MEMBERSHIP_MAP[tier] -
                    skybox.skyboxChannelMembers.length,
            },
            generatePartialChannelMember
        ) as SkyboxFan[];

        console.log("updatedChannelMembers: ", updatedChannelMembers);

        set({
            channelMembers: [...updatedChannelMembers, ...emptyChannelMember],
        });
    },
}));
