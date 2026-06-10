import { generatePartialSkybox, useSkyboxStore } from "@/store/useSkyboxStore";
import { useState } from "react";
import { SkyboxInviteMembersModal } from "./SkyboxInviteMembersModal";
import Image from "next/image";
import { SkyboxToast } from "./SkyboxToast";
import usePubnubStore from "@/store/usePubnubStore";
import { Chat } from "@pubnub/chat";
import { SkyboxFan } from "./types";
import { useGetUsersStore } from "@/store/useGetUsersStore";
import { TIER_MAX_MEMBERSHIP_MAP } from "@/constants/constants";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import useChatHistory from "@/hooks/useChatHistory";
import { truncateString } from "@/utils/util";
import SkyboxAvatar from "./SkyboxAvatar";

interface SkyboxMembersProps {
    teamName?: string;
    maxMembers?: number;
    currentMembers?: number;
    onClose?: any;
    onOpenSettings?: any;
    logoPreview?: any;
}
const SkyboxMembers = ({
    teamName = "Skybox Team",
    maxMembers = 20, // Set to exactly 20 members (2 rows of 10)
    currentMembers = 1,
    onClose = () => {},
    onOpenSettings = () => {},
    logoPreview = null,
}: SkyboxMembersProps) => {
    const { pubnub } = usePubnubStore();
    const [selectedMember, setSelectedMember] = useState<SkyboxFan | null>(
        null
    );
    const [toast, setToast] = useState({ message: "", visible: false });
    const {
        selectedSkybox,
        channelMembers,
        setChannelMembers,
        setSelectRemoveMember,
        setSelectedSkybox,
        generalSkybox,
        setShowInviteModal,
        showSkybox,
    } = useSkyboxStore();
    const { users } = useGetUsersStore();
    const { userDB } = useWildfileUserContext();
    const { resetHistory } = useChatHistory(); // Add this hook to get resetHistory

    // const [members, setMembers] = useState(() => {
    //     // Initialize with first member occupied
    //     const slots = [];

    //     slots.push({
    //         id: 1,
    //         occupied: true,
    //         avatar: logoPreview || "/images/pfps/azuki.jpg",
    //         username: "Sampson",
    //         isOwner: true,
    //     });

    //     // Add exactly 19 empty slots for the remaining positions (example data)
    //     for (let i = 2; i <= maxMembers; i++) {
    //         slots.push({
    //             id: i,
    //             occupied: false,
    //             avatar: "",
    //             username: "",
    //             isOwner: false,
    //         });
    //     }

    //     return slots;
    // });
    // const [members, setMembers] = useState<SkyboxFan[]>(() => {
    //     if (!selectedSkybox) {
    //         return [] as SkyboxFan[];
    //     }

    //     return selectedSkybox.skyboxChannelMembers.map((channelMemberId) => {
    //         const channelMember = users.find(
    //             (user) => channelMemberId === user.id
    //         );
    //         if (!channelMember) {
    //             return;
    //         }
    //         return {
    //             id: channelMember.id,
    //             name: channelMember.name,
    //             pfpUrl: channelMember.profileUrl,
    //         } as SkyboxFan;
    //     }) as SkyboxFan[];
    // });

    const { fetchChannel, generalChannel, activeChannel, setActiveChannel } =
        usePubnubStore();

    const handleEmptySlotClick = () => {
        if (!selectedSkybox) {
            return;
        }

        if (selectedSkybox.ownerUserId.toString() !== userDB?._id?.toString()) {
            return;
        }

        setShowInviteModal(true);
    };

    // Handle member removal
    // const handleRemoveMember = (
    //     e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    //     member: SkyboxFan
    // ) => {
    //     e.stopPropagation();
    //     setSelectRemoveMember(member);
    // };

    const minimizeSkybox = async () => {
        if (!pubnub) return;

        // Toggle the entire SkyBox visibility
        useSkyboxStore.getState().toggleSkybox();

        if (!generalChannel) {
            console.log("Channel is null or undefined");
            return;
        }

        // Clear the selected skybox
        setSelectedSkybox(generalSkybox);

        //clean up the current channel subscription

        // stopUpdates();
        // Reset history for new channel
        resetHistory();

        // Fetch and set the new channel
        const newChannel = await fetchChannel(generalChannel.id);

        //Set the new active channel
        setActiveChannel(newChannel);
    };

    const maxChannelMembers = selectedSkybox?.skyboxTier
        ? TIER_MAX_MEMBERSHIP_MAP[selectedSkybox.skyboxTier]
        : 0;
    const channelMemberCount = channelMembers.filter((channelMember) =>
        Boolean(channelMember.id)
    ).length;

    const skyboxOwnerUserId = selectedSkybox?._id
        ? selectedSkybox?.ownerUserId.toString()
        : "";

    const isSkyboxOwner = skyboxOwnerUserId === userDB?._id?.toString();
    const isChannelMember = selectedSkybox
        ? selectedSkybox.skyboxChannelMembers.some((channelMemberId) => {
              return channelMemberId == userDB?._id?.toString();
          })
        : false;
    const isOwnerOrChannelMember = isSkyboxOwner || isChannelMember;

    // Do not show if skybox is not selected and user is not owner or member of selected skybox
    if (!showSkybox || !isOwnerOrChannelMember) {
        return null;
    }

    return (
        <div className="w-full h-auto">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                    <h2
                        className="text-xl md:text-lg text-white font-bold "
                        title={teamName}
                    >
                        <span className="hidden md:inline">
                            {/* max character on > md before truncation */}
                            {truncateString(teamName, 20)}
                        </span>
                        <span className="inline md:hidden">
                            {truncateString(teamName, 22)}
                        </span>
                    </h2>
                    <span className="ml-2 mr-2 text-gray-400 text-sm">
                        {channelMemberCount}/{maxChannelMembers}
                    </span>
                </div>
                <div className="flex items-center space-x-3">
                    {/* Settings (cog) button */}
                    {isSkyboxOwner && (
                        <button
                            onClick={onOpenSettings}
                            className="text-white hover:text-gray-300 transition-colors"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                        </button>
                    )}
                    {/* Close/expand button */}
                    <button
                        onClick={minimizeSkybox}
                        className="text-white text-2xl hover:text-gray-300 transition-colors"
                        title="Minimize Skybox"
                    >
                        ×
                    </button>
                </div>
            </div>

            {/* Member grid - exactly 2 rows of 10 members (20 total) */}
            <div className="w-full mb-4">
                <div className="grid grid-cols-10 gap-1">
                    {channelMembers.map((channelMember, index) => {
                        const isFirst = index === 0 || index === 10;
                        const isLast =
                            index === channelMembers.length - 1 || index === 9;

                        return (
                            <div
                                key={`member-${index}`}
                                className="relative w-full aspect-square flex-shrink-0 group"
                                onClick={() => {
                                    if (channelMember.id) {
                                        setSelectedMember(channelMember);
                                    } else {
                                        handleEmptySlotClick();
                                    }
                                }}
                            >
                                {/* Invite Member to Skybox */}
                                {!channelMember.id && (
                                    <div
                                        className={`absolute ${
                                            isFirst
                                                ? "left-[150%] -translate-x-0"
                                                : isLast
                                                ? "right-[-50%] translate-x-0"
                                                : "left-1/2 -translate-x-1/2"
                                        } bottom-full mb-1 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap transform -translate-x-1/2 z-[999999]`}
                                    >
                                        Invite Member
                                        {/* Triangle pointer pointing down */}
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-[4px] border-transparent border-t-gray-900"></div>
                                    </div>
                                )}

                                {/* {channelMember.id && (
                                    <div
                                        className={`absolute ${
                                            isLast
                                                ? "right-[-50%] translate-x-0"
                                                : "left-[-50%]"
                                        } bottom-full mb-1 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap `}
                                    >
                                        {channelMember.name}
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-[4px] border-transparent border-t-gray-900"></div>
                                    </div>
                                )} */}

                                {/* Selected indicator (white ring) */}
                                {selectedMember &&
                                    channelMember &&
                                    selectedMember.id === channelMember.id && (
                                        <div className="absolute inset-0 rounded-full border-2 border-white"></div>
                                    )}

                                {/* <div
                                    className={`w-full h-full rounded-full flex items-center justify-center ${
                                        isSkyboxOwner
                                            ? "cursor-pointer"
                                            : "none"
                                    } ${
                                        channelMember
                                            ? "bg-[#444444] overflow-hidden"
                                            : "bg-[#3A3A3A] hover:bg-[#444444] group-hover:border group-hover:border-white/50"
                                    }`}
                                >
                                    {channelMember.pfpUrl ? (
                                        <Image
                                            src={channelMember.pfpUrl}
                                            alt={channelMember.name}
                                            width={40}
                                            height={40}
                                            className="w-full h-full object-cover"
                                            unoptimized={
                                                !channelMember.pfpUrl.includes(
                                                    ".svg"
                                                )
                                            }
                                        />
                                    ) : (
                                        <span className="text-gray-200 text-sm ">
                                            +
                                        </span>
                                    )}
                                </div> */}

                                <SkyboxAvatar
                                    skyboxFan={channelMember}
                                    isSkyboxOwner={isSkyboxOwner}
                                    isLast={isLast}
                                    inviteFlag={true}
                                />

                                {/* Remove button (only for occupied non-owner slots) */}
                                {/* {isSkyboxOwner ? (
                                channelMember.id &&
                                channelMember.id !== skyboxOwnerUserId && (
                                    <div
                                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600 z-20 text-xs"
                                        onClick={(e) =>
                                            handleRemoveMember(e, channelMember)
                                        }
                                        title="Remove member"
                                    >
                                        ×
                                    </div>
                                )
                            ) : (
                                <></>
                            )} */}

                                {/* {member.isOwner && (
                                <div className="absolute -top-1 -right-1 bg-yellow-500 text-[8px] text-black font-bold px-0.5 rounded-sm shadow-md z-20">
                                    Owner
                                </div>
                            )} */}
                            </div>
                        );
                    })}
                </div>
            </div>

            <SkyboxToast
                message={toast.message}
                isVisible={toast.visible}
                onClose={() => setToast({ ...toast, visible: false })}
                bgStyle={"success"}
            />
        </div>
    );
};

export default SkyboxMembers;
