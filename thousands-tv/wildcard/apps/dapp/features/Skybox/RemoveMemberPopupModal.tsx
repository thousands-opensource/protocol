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

const RemoveMemberPopupModal = () => {
    const toast = useToast();
    const {
        toggleSkybox,
        selectedOption,
        skyboxes,
        selectedSkybox,
        setSelectedSkybox,
        setChannelMembers,
        selectRemoveMember,
        setSelectRemoveMember,
        populateChannelMembers,
    } = useSkyboxStore();
    const { setActiveChannel, fetchChannel, generalChannel, pubnub } =
        usePubnubStore();
    const { users } = useGetUsersStore();
    const cancelRef = useRef<HTMLButtonElement>(null);
    const { loadingSpinner, setLoadingSpinner } = useGlobalContext();

    const handleRemove = async () => {
        if (!selectedSkybox) {
            toast({
                title: "Skybox was not selected",
                status: "error",
                duration: 5000,
                position: "top",
            });
            return;
        }

        if (!selectRemoveMember) {
            toast({
                title: "Member was not selected for removal",
                status: "error",
                duration: 5000,
                position: "top",
            });
            return;
        }
        try {
            setLoadingSpinner(true);
            const stageId: string = selectedSkybox.stageId.toString();
            const skyboxId: string = selectedSkybox?._id!.toString();
            const memberUserId = selectRemoveMember?.id;
            var response = await axiosAuthClientInstance.post(
                `${getSkyboxStreamAppApiEndpoint()}/remove-member`,
                {
                    stageId,
                    skyboxId,
                    memberUserId,
                }
            );

            console.log("Remove member response: ", response.data);

            const removeMemberData = response.data;
            if (!removeMemberData.success) {
                toast({
                    title: removeMemberData.errorMessage,
                    status: "error",
                    duration: 5000,
                    position: "top",
                });
                handleCancel();
                return;
            }

            toast({
                title: `You have successfully remove user ${selectRemoveMember.name}.`,
                status: "success",
                duration: 5000,
                position: "top",
            });

            populateChannelMembers(users, selectedSkybox);
            handleCancel();
        } catch (e: any) {
            toast({
                title: `Opps! Unable to remove the user. Please try again.`,
                status: "error",
                duration: 5000,
                position: "top",
            });
            handleCancel();
        }
    };

    const handleCancel = () => {
        setSelectRemoveMember(null);
        setLoadingSpinner(false);
    };

    return (
        <>
            <AlertDialog
                isOpen={Boolean(selectRemoveMember)}
                leastDestructiveRef={cancelRef}
                onClose={handleCancel}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Channel Member Removal
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            Are you sure you want to remove ?
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button
                                colorScheme="red"
                                onClick={handleCancel}
                                ref={cancelRef}
                                isLoading={loadingSpinner}
                            >
                                Cancel
                            </Button>
                            <Button
                                colorScheme="green"
                                onClick={handleRemove}
                                ml={3}
                                isLoading={loadingSpinner}
                            >
                                Remove
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </>
    );
};

export default RemoveMemberPopupModal;
