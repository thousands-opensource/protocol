import { Avatar, Box, Flex, Text } from "@chakra-ui/react";
import { SkyboxFan } from "./types";
import {
    generatePartialChannelMember,
    useSkyboxStore,
} from "@/store/useSkyboxStore";
import { useGetUsersStore } from "@/store/useGetUsersStore";
import usePubnubStore from "@/store/usePubnubStore";
import Image from "next/image";
import { TIER_MAX_MEMBERSHIP_MAP } from "@/constants/constants";
import SkyboxAvatar from "./SkyboxAvatar";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";

interface SkyboxGroupAvatarProps {
    maxVisible?: number;
    size?: number; // in px
    showBlur?: boolean;
}

export const SkyboxGroupAvatar = ({
    maxVisible = 0,
    size = 40,
    showBlur = true,
}: SkyboxGroupAvatarProps) => {
    const {
        showSkybox,
        selectedSkybox,
        channelMembers,
        setSelectedSkybox,
        generalSkybox,
    } = useSkyboxStore();
    const { users } = useGetUsersStore();
    const { fetchChannel, generalChannel, pubnub } = usePubnubStore();
    const { userDB } = useWildfileUserContext();
    let visibleAvatars: SkyboxFan[] = [];
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

    let skyboxOwner: SkyboxFan | null = null;
    let extraCount = 0;
    let teamName = "";
    if (selectedSkybox) {
        teamName = selectedSkybox.skyboxName;
        extraCount = selectedSkybox.skyboxChannelMembers.length - maxVisible;
        const skyboxFans = selectedSkybox.skyboxChannelMembers.map(
            (channelMemberId: string) => {
                const channelMember = users.find(
                    (user) => channelMemberId === user.id
                );
                if (!channelMember) {
                    return;
                }
                return {
                    id: channelMember.id,
                    name: channelMember.name,
                    pfpUrl: channelMember.profileUrl,
                } as SkyboxFan;
            }
        ) as SkyboxFan[];
        visibleAvatars = [...skyboxFans.slice(0, maxVisible)];

        const foundSkyboxOwner = users.find(
            (user) =>
                user.id.toString() === selectedSkybox.ownerUserId.toString()
        );
        if (foundSkyboxOwner) {
            const { id, name, profileUrl } = foundSkyboxOwner;
            skyboxOwner = { id, name, pfpUrl: profileUrl };
        }
    }

    const minimizeSkybox = async () => {
        if (!pubnub) return;
        // Toggle the entire SkyBox visibility
        useSkyboxStore.getState().toggleSkybox();

        if (!generalChannel) {
            console.log("Channel is null or undefined");
            return;
        }

        setSelectedSkybox(generalSkybox);
        await fetchChannel(generalChannel.id);
    };

    // Do not show if skybox is not selected and user is owner or member of that skybox
    if (!showSkybox || isOwnerOrChannelMember) {
        return null;
    }

    return (
        <div className="flex items-center px-2 ">
            <div className="w-full flex flex-row items-center p-0 m-0">
                {/*
                <div
                    className={`w-[65px] h-[40px] rounded-full flex items-center justify-center cursor-pointer ${
                        skyboxOwner?.pfpUrl
                            ? "bg-gray-500 overflow-hidden"
                            : "bg-[#3A3A3A] hover:bg-[#4A4A4A] group-hover:border group-hover:border-white/50"
                    }`}
                >
                    {skyboxOwner?.pfpUrl && (
                        <Image
                            src={skyboxOwner?.pfpUrl}
                            alt={skyboxOwner?.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>
                */}
                <div className="flex flex-col items-center w-full p-0 m-0">
                    <div className="flex flex-row items-center justify-between w-full ">
                        <div className="flex flex-row items-center gap-1">
                            <h2
                                className="text-xs text-white font-bold truncate max-w-[150px]"
                                title={teamName}
                            >
                                {teamName}
                            </h2>
                            <span className="text-gray-400 text-[10px] whitespace-nowrap">
                                {channelMemberCount}/{maxChannelMembers}
                            </span>
                        </div>
                        <button
                            onClick={minimizeSkybox}
                            className="text-white text-2xl hover:text-gray-300 transition-colors ml-auto"
                            title="Minimize Skybox"
                        >
                            ×
                        </button>
                    </div>
                    <div className="w-full mb-1">
                        <div className="grid grid-cols-10 gap-1">
                            {channelMembers.map((channelMember, index) => {
                                const isLast =
                                    index === channelMembers.length - 1 ||
                                    index === 20;

                                return (
                                    <div
                                        key={`member-${index}`}
                                        className="relative w-full aspect-square flex-shrink-0 group"
                                    >
                                        {/* {channelMember.id && (
                                            <div
                                                className={`absolute ${
                                                    isLast
                                                        ? "right-[-50%] translate-x-0"
                                                        : "left-[-50%]"
                                                } bottom-full mb-1 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap`}
                                            >
                                                {channelMember.name}
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-[4px] border-transparent border-t-gray-900"></div>
                                            </div>
                                        )}
                                        <div
                                            className={`w-full h-full rounded-full flex items-center justify-center cursor-pointer ${
                                                channelMember
                                                    ? "bg-gray-500 overflow-hidden"
                                                    : "bg-[#3A3A3A] hover:bg-[#4A4A4A] group-hover:border group-hover:border-white/50"
                                            }`}
                                        >
                                            {channelMember.pfpUrl && (
                                                <Image
                                                    src={channelMember.pfpUrl}
                                                    alt={channelMember.name}
                                                    width={40}
                                                    height={40}
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div> */}
                                        <SkyboxAvatar
                                            skyboxFan={channelMember}
                                            isSkyboxOwner={isSkyboxOwner}
                                            isLast={isLast}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
