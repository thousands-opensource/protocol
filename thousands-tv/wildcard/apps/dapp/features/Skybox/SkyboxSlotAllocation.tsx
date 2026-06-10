import {
    generatePartialChannelMember,
    generatePartialSkybox,
    useSkyboxStore,
} from "@/store/useSkyboxStore";
import React, { useEffect, useMemo, useState } from "react";
import SkyboxPurchaseModal from "./SkyboxPurchaseModal";
import { SkyboxFan, SkyboxSlot } from "./types";
import { slotsData } from "./exampleData";
import Image from "next/image";
import { Channel, Chat, Message } from "@pubnub/chat";
import { ISkybox, WildcardApiResponse } from "@repo/interfaces";
import axios from "axios";
import { ChannelEntity } from "@pubnub/react-chat-components";
import { useStreamContext } from "@/contexts/streamContext";
import usePubnubStore from "@/store/usePubnubStore";
import axiosAuthClientInstance from "@/lib/axiosAuthClientInstance";
import { getSkyboxStreamAppApiEndpoint } from "@/utils/environmentUtil";
import { useToast } from "@chakra-ui/react";
import { useGetUsersStore } from "@/store/useGetUsersStore";
import { TIER_MAX_MEMBERSHIP_MAP } from "@/constants/constants";
import { useEmoteSource } from "@/hooks/useEmoteSource";
import { useEmotesStore } from "@/store/useEmotesStore";
import { AnimatedEmotes } from "@/components/Animation/AnimatedEmotes";
import { isMobile } from "react-device-detect";
import { useGlobalContext } from "@/contexts/globalContext";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import useCreditBalance from "@/hooks/credits/useCreditBalance";
import useChatHistory from "@/hooks/useChatHistory";

export const SkyboxSlotAllocation = () => {
    const { pubnub } = usePubnubStore();
    const { setLoadingSpinner } = useGlobalContext();
    const [showLayout, setShowLayout] = useState(false);
    // const [selectedSlot, setSelectedSlot] = useState<SkyboxSlot | null>(null);
    const [showPurchaseModal, setShowPurchaseModal] = useState<boolean>(false);
    const {
        toggleSkybox,
        selectedOption,
        skyboxes,
        selectedSkybox,
        setSelectedSkybox,
        setChannelMembers,
        populateChannelMembers,
        toggleSettings,
        generalSkybox,
        isSkyboxesVisible,
    } = useSkyboxStore();
    const { users } = useGetUsersStore();
    const { resetHistory } = useChatHistory();
    const {
        setActiveChannel,
        activeChannel,
        fetchChannel,
        generalChannel,
        setToken,
    } = usePubnubStore();

    // const [slots, setSlots] = useState(slotsData);

    const { vendorEventId, eventId } = useStreamContext();
    const toast = useToast();
    const { triggerEmote, addSourceRef, removeSourceRef } = useEmotesStore();
    const { userDB } = useWildfileUserContext();
    const { fetchCreditBalance } = useCreditBalance(
        userDB?._id?.toString() || ""
    );

    const skyboxesSlot = useMemo(() => {
        return generalSkybox
            ? [generalSkybox, ...skyboxes]
            : [generatePartialSkybox() as ISkybox, ...skyboxes];
    }, [generalSkybox, skyboxes]);

    const skyboxRefs = useMemo(() => {
        return skyboxes.reduce((acc, skybox) => {
            if (skybox._id) {
                acc[skybox._id.toString()] = React.createRef<HTMLDivElement>();
            }
            return acc;
        }, {} as Record<string, React.RefObject<HTMLDivElement>>);
    }, [skyboxes]);

    useEffect(() => {
        Object.entries(skyboxRefs).forEach(([id, ref]) => {
            addSourceRef(`skybox-${id}`, ref);
        });

        return () => {
            Object.entries(skyboxRefs).forEach(([id]) => {
                removeSourceRef(`skybox-${id}`);
            });
        };
    }, [skyboxRefs, addSourceRef, removeSourceRef]);

    /**
     * Switches the active channel to the specified channel ID.
     * Cleans up the previous channel's listeners and updates the active channel.
     * @param channelId
     * @returns
     */
    const switchChannel = async (channelId: string) => {
        console.log("Switching to channel:", channelId);

        // stopUpdates();
        //fetch and set the new channel
        const newChannel = await fetchChannel(channelId);
        // Reset history for new channel
        resetHistory();
        // Set active channel after cleanup
        setActiveChannel(newChannel);
        return newChannel;
    };

    const handleSlotClick = async (skybox: ISkybox) => {
        if (!pubnub) {
            return;
        }

        if (skybox.createdAt) {
            if (
                skybox._id?.toString() === selectedSkybox?._id?.toString() ||
                skybox._id?.toString() === generalSkybox?._id?.toString()
            ) {
                setSelectedSkybox(generalSkybox);
                toggleSkybox(false);
                if (!generalChannel) {
                    console.log("Channel is null or undefined");
                    return;
                }

                setActiveChannel(generalChannel);
                return;
            }

            const isChannelMember = skybox
                ? skybox.skyboxChannelMembers.some((channelMemberId) => {
                    return channelMemberId == userDB?._id?.toString();
                })
                : false;
            const isOwner = skybox
                ? skybox.ownerUserId.toString() === userDB?._id?.toString()
                : false;
            const isOwnerOrChannelMember = isOwner || isChannelMember;

            console.log(
                "owner click a skybox and isOwnerOrChannelMember",
                isOwnerOrChannelMember
            );

            // MODIFIED: Use switchChannel instead of fetchChannel
            if (!isOwnerOrChannelMember) {
                if (!generalChannel) {
                    console.log("Channel is null or undefined");
                    return;
                }

                setActiveChannel(generalChannel);
            } else {
                const skyboxChannelId = `g.${skybox.stageId.toString()}.${skybox._id?.toString()}`;
                await switchChannel(skyboxChannelId);
                setShowLayout(true);
            }

            setSelectedSkybox(skybox);
            populateChannelMembers(users, skybox);
            toggleSkybox(true);
        } else {
            setShowPurchaseModal(true);
        }
    };

    const purchaseSkybox = async () => {
        console.log("start purchaseSkybox");

        if (!pubnub) return;

        if (!selectedOption) {
            toast({
                title: "You must select a valid skybox tier",
                status: "error",
                duration: 5000,
                position: "top",
            });
            return;
        }

        try {
            setLoadingSpinner(true);
            var response = await axiosAuthClientInstance.post(
                `${getSkyboxStreamAppApiEndpoint()}/purchase-skybox`,
                {
                    stageId: eventId,
                    skyboxTier: selectedOption.id,
                }
            );

            const purchaseSkyboxResponse = response.data;
            if (!purchaseSkyboxResponse.success) {
                toast({
                    title: purchaseSkyboxResponse.errorMessage,
                    status: "error",
                    duration: 5000,
                    position: "top",
                });
                return;
            }

            toast({
                title: "You have successfully purchase a skybox!",
                status: "success",
                duration: 5000,
                position: "top",
            });

            try {
                const purchaseSkyboxData = purchaseSkyboxResponse.data;
                const skybox: ISkybox = purchaseSkyboxData.skybox;
                const skyboxChannelId = `g.${skybox.stageId
                    }.${skybox._id?.toString()}`;
                const pubnubToken: string = purchaseSkyboxData.pubnubToken;
                pubnub.sdk.setToken(pubnubToken);

                console.log("what is this skybox channel id", skyboxChannelId);

                await switchChannel(skyboxChannelId);

                setToken(pubnubToken);
                populateChannelMembers(users, skybox);
                setSelectedSkybox(skybox);
                toggleSkybox(true);
                toggleSettings(true);
            } catch (e: any) {
                console.error("Unable to fetch channel");
                return;
            } finally {
                setLoadingSpinner(false);
            }

            if (fetchCreditBalance) {
                await fetchCreditBalance();
            }

            return;
        } catch (e: any) {
            toast({
                title: "Opps! You have failed to purchase a skybox. Please try again in a few minutes.",
                status: "error",
                duration: 5000,
                position: "top",
            });
            return;
        } finally {
            setLoadingSpinner(false);
        }
    };

    const handlePurchase = async () => {
        await purchaseSkybox();
    };

    if (!isSkyboxesVisible) {
        return null;
    }

    return (
        <>
            <div className="w-full h-10 bg-[#000000] flex items-center justify-between px-2">
                <div className="flex-1 flex space-x-2 mr-4">
                    {skyboxesSlot.map(
                        (skybox, index) =>
                            index > 0 && (
                                <div
                                    key={`${index}-${skybox._id?.toString()}`}
                                    ref={
                                        skybox._id
                                            ? skyboxRefs[skybox._id.toString()]
                                            : undefined
                                    }
                                    className={`rounded-md ${skybox.createdAt
                                            ? `bg-[${skybox.skyboxPrimaryColor}] `
                                            : "bg-[#414141] hover:bg-[#505050] "
                                        } ${selectedSkybox &&
                                            selectedSkybox?._id?.toString() ===
                                            skybox?._id?.toString()
                                            ? "ring-1 ring-white"
                                            : ""
                                        } transition-colors cursor-pointer flex items-center justify-center h-7 flex-1 relative group`}
                                    style={{
                                        backgroundColor: skybox.createdAt
                                            ? skybox.skyboxPrimaryColor
                                            : "#444444",
                                    }}
                                    onClick={() => handleSlotClick(skybox)}
                                    title="Purchase Skybox"
                                >
                                    {/* Tooltip below button */}
                                    <div className="absolute first:left-[105%] left-1/2 top-full mt-1 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap transform -translate-x-1/2 z-[9999]">
                                        {skybox.createdAt
                                            ? skybox.skyboxName
                                            : "Create new Skybox"}
                                        {/* Triangle pointer pointing up */}
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
                                    </div>
                                    {skybox.createdAt ? (
                                        <div className="flex items-center justify-center">
                                            {/* Avatar with white outline */}
                                            <div className="w-6 h-6 rounded-full border-0 border-white overflow-hidden">
                                                <Image
                                                    src={
                                                        skybox.skyboxLogoUrl ||
                                                        ""
                                                    }
                                                    alt={
                                                        skybox.skyboxName ||
                                                        "Skybox Avatar"
                                                    }
                                                    width={30}
                                                    height={30}
                                                    className="w-full h-full object-cover"
                                                    unoptimized={
                                                        !skybox.skyboxLogoUrl.includes(
                                                            ".svg"
                                                        )
                                                    } // otherwise, dicebear svgs won't load
                                                />
                                                {skybox.skyboxLogoUrl}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-white text-xl font-normal">
                                            +
                                        </span>
                                    )}
                                </div>
                            )
                    )}
                </div>
                <div className="text-white font-bold uppercase tracking-wider text-sm whitespace-nowrap">
                    SKYBOX
                </div>
                <AnimatedEmotes />
            </div>

            {/* Purchase Modal */}
            <SkyboxPurchaseModal
                isOpen={showPurchaseModal}
                onClose={() => setShowPurchaseModal(false)}
                onPurchase={handlePurchase}
            />
        </>
    );
};