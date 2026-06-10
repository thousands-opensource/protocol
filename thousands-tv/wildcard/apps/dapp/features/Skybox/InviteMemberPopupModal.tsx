import React, { MutableRefObject, useRef, useState } from "react";
import {
    Button,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
} from "@chakra-ui/react";
import {
    generatePartialChannelMember,
    useSkyboxStore,
} from "@/store/useSkyboxStore";
import { Chat } from "@pubnub/chat";
import axiosAuthClientInstance from "@/lib/axiosAuthClientInstance";
import { getSkyboxStreamAppApiEndpoint } from "@/utils/environmentUtil";
import { useToast } from "@chakra-ui/react";
import { ISkybox, WildcardApiResponse } from "@repo/interfaces";
import usePubnubStore from "@/store/usePubnubStore";
import { TIER_MAX_MEMBERSHIP_MAP } from "@/constants/constants";
import { useGetUsersStore } from "@/store/useGetUsersStore";
import { SkyboxFan } from "./types";
import { useGlobalContext } from "@/contexts/globalContext";

const InviteMemberPopupModal = () => {
    const { pubnub } = usePubnubStore();
    const toast = useToast();
    const {
        toggleSkybox,
        selectedOption,
        skyboxes,
        selectedSkybox,
        setSelectedSkybox,
        setChannelMembers,
        openSkyboxInviteModal,
        setOpenSkyboxInviteModal,
        skyboxInviteId,
        populateChannelMembers,
        skyboxInviteDetail,
        setSkyboxInviteDetail,
    } = useSkyboxStore();
    const { setActiveChannel, fetchChannel, setToken } = usePubnubStore();
    const { users } = useGetUsersStore();
    const { loadingSpinner, setLoadingSpinner } = useGlobalContext();
    const cancelRef = useRef<HTMLButtonElement>(null);

    const handleAccept = async () => {
        try {
            if (!pubnub) return;
            setLoadingSpinner(true);
            var response = await axiosAuthClientInstance.post(
                `${getSkyboxStreamAppApiEndpoint()}/accept-reject-invite`,
                {
                    skyboxInviteId,
                    acceptOrReject: true,
                }
            );

            setOpenSkyboxInviteModal(false);

            console.log("Accept or reject response: ", response.data);

            const acceptOrRejectInviteResponse = response.data;
            if (!acceptOrRejectInviteResponse.success) {
                toast({
                    title: acceptOrRejectInviteResponse.errorMessage,
                    status: "error",
                    duration: 5000,
                    position: "top",
                });
                setLoadingSpinner(false);
                return;
            }

            try {
                const acceptOrRejectInviteData =
                    acceptOrRejectInviteResponse.data;
                const skybox: ISkybox = acceptOrRejectInviteData.skybox;
                const skyboxChannelId = `g.${
                    skybox.stageId
                }.${skybox._id?.toString()}`;
                const pubnubToken: string =
                    acceptOrRejectInviteData.pubnubToken;
                pubnub.sdk.setToken(pubnubToken);

                console.log("what is this skybox channel id", skyboxChannelId);
                const updatedChannel = await pubnub.getChannel(skyboxChannelId);
                console.log("Now fetching that channel", updatedChannel);
                setActiveChannel(updatedChannel);

                setToken(pubnubToken);
                populateChannelMembers(users, skybox);
                setSelectedSkybox(skybox);
                toggleSkybox(true);
                setLoadingSpinner(false);
            } catch (e: any) {
                console.error("Unable to fetch channel");
                setLoadingSpinner(false);
            }

            setSkyboxInviteDetail(null);
        } catch (e: any) {
            toast({
                title: `Unable to accept the invite. Please try again.`,
                status: "error",
                duration: 5000,
                position: "top",
            });
            setOpenSkyboxInviteModal(false);
            setLoadingSpinner(false);
            return;
        }
    };

    const handleReject = async () => {
        try {
            setLoadingSpinner(true);

            var response = await axiosAuthClientInstance.post(
                `${getSkyboxStreamAppApiEndpoint()}/accept-reject-invite`,
                {
                    skyboxInviteId,
                    acceptOrReject: false,
                }
            );

            setOpenSkyboxInviteModal(false);

            const acceptOrRejectInviteData = response.data;
            if (!acceptOrRejectInviteData.success) {
                toast({
                    title: acceptOrRejectInviteData.errorMessage,
                    status: "error",
                    duration: 5000,
                    position: "top",
                });
                return;
            }
            setSkyboxInviteDetail(null);
            setLoadingSpinner(false);
        } catch (e: any) {
            toast({
                title: `Unable to reject the invite. Please try again.`,
                status: "error",
                duration: 5000,
                position: "top",
            });
            setOpenSkyboxInviteModal(false);
            setLoadingSpinner(false);
        }
    };

    const skyboxOwnerName = skyboxInviteDetail
        ? skyboxInviteDetail.skyboxOwner.name
        : "";
    return (
        <>
            <AlertDialog
                isOpen={openSkyboxInviteModal}
                leastDestructiveRef={cancelRef}
                onClose={() => setOpenSkyboxInviteModal(false)}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            {`Invitation to join ${skyboxInviteDetail?.skyboxName}`}
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            {`${skyboxOwnerName} has invited you to join ${skyboxInviteDetail?.skyboxName}. Would you like to join?`}
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button
                                colorScheme="red"
                                onClick={handleReject}
                                ref={cancelRef}
                                isLoading={loadingSpinner}
                            >
                                Reject
                            </Button>
                            <Button
                                colorScheme="green"
                                onClick={handleAccept}
                                ml={3}
                                isLoading={loadingSpinner}
                            >
                                Accept
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </>
    );
};

export default InviteMemberPopupModal;
