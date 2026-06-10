import React, { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import axiosAuthClientInstance from "@/lib/axiosAuthClientInstance";
import { getSkyboxStreamAppApiEndpoint } from "@/utils/environmentUtil";
import { useToast } from "@chakra-ui/react";
import { useSkyboxStore } from "@/store/useSkyboxStore";
import { SkyboxFan } from "./types";

interface User {
    id: number;
    username: string;
    avatar: string;
}

// New invite modal component
interface SkyboxInviteMembersModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SkyboxInviteMembersModal: React.FC<
    SkyboxInviteMembersModalProps
> = ({ isOpen, onClose }) => {
    const [searchInput, setSearchInput] = useState("");
    const [selectedUser, setSelectedUser] = useState<SkyboxFan | null>(null);
    const [filteredUsers, setFilteredUsers] = useState<SkyboxFan[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showMinLengthMessage, setShowMinLengthMessage] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const previousQueryRef = useRef<string>("");
    const toast = useToast();
    const { selectedSkybox, skyboxes } = useSkyboxStore();

    // Minimum number of characters required for search
    const MIN_SEARCH_LENGTH = 3;

    // Reset the modal state when it opens or closes
    useEffect(() => {
        if (isOpen) {
            // Only focus the input when opening
            if (inputRef.current) {
                inputRef.current.focus();
            }
        } else {
            // Reset all state when the modal closes
            resetModalState();
        }
    }, [isOpen]);

    // Clean up debounce timeout on unmount
    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    // Handle click outside dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Handle invite submission on user selection
    const onInvite = async (member: SkyboxFan) => {
        try {
            if (!selectedSkybox) {
                toast({
                    title: "Skybox was not selected",
                    status: "error",
                    duration: 5000,
                    position: "top",
                });
                return;
            }
            const stageId: string = selectedSkybox.stageId.toString();
            const skyboxId: string = selectedSkybox?._id!.toString();
            const memberUserId: string = member.id;
            var response = await axiosAuthClientInstance.post(
                `${getSkyboxStreamAppApiEndpoint()}/invite-member`,
                {
                    stageId,
                    skyboxId,
                    memberUserId,
                }
            );

            const inviteMemberResponse = response.data;
            if (!inviteMemberResponse.success) {
                toast({
                    title: inviteMemberResponse.errorMessage,
                    status: "error",
                    duration: 5000,
                    position: "top",
                });
                return;
            }

            toast({
                title: `You have invited ${member.name}.`,
                status: "success",
                duration: 5000,
                position: "top",
            });
        } catch (e: any) {
            toast({
                title: `Opps! You have failed to invite ${member.name}. Please try again in a few minutes.`,
                status: "error",
                duration: 5000,
                position: "top",
            });
            return;
        }
    };

    /***
     * API to search for users
     * @param query - The search query
     * trims the query and checks if it's empty or too short (based)
     */
    const querySearchAutocomplete = useCallback(
        async (query: string) => {
            const trimmedQuery = query.trim();

            // Early exit if query is empty or too short
            if (!trimmedQuery || trimmedQuery.length < MIN_SEARCH_LENGTH) {
                setFilteredUsers([]);
                setIsDropdownOpen(false);
                return;
            }

            if (trimmedQuery === previousQueryRef.current) {
                return;
            }
            previousQueryRef.current = trimmedQuery;

            try {
                setIsLoading(true);
                if (!selectedSkybox) {
                    toast({
                        title: "You must select a skybox to search",
                        status: "error",
                        duration: 5000,
                        position: "top",
                    });
                    return;
                }

                const skyboxId = selectedSkybox?._id!.toString();
                const stageId = selectedSkybox.stageId;

                const response = await axiosAuthClientInstance.post(
                    `${getSkyboxStreamAppApiEndpoint()}/search-fan`,
                    {
                        skyboxId,
                        stageId,
                        fanName: trimmedQuery.toLowerCase(),
                    }
                );

                const autocompleteSearchFanData = response.data;
                if (!autocompleteSearchFanData.success) {
                    toast({
                        title: autocompleteSearchFanData.errorMessage,
                        status: "error",
                        duration: 5000,
                        position: "top",
                    });
                    return;
                }

                const skyboxFans: SkyboxFan[] = autocompleteSearchFanData.data;

                setFilteredUsers(skyboxFans);
                setIsDropdownOpen(skyboxFans.length > 0);
            } catch (e: any) {
                toast({
                    title: "Oops! Failed to search for users.",
                    status: "error",
                    duration: 5000,
                    position: "top",
                });
            } finally {
                setIsLoading(false);
            }
        },
        [selectedSkybox, toast]
    );

    // Function to reset all modal state
    const resetModalState = () => {
        setSearchInput("");
        setSelectedUser(null);
        setFilteredUsers([]);
        setIsDropdownOpen(false);
        setShowMinLengthMessage(false);
        previousQueryRef.current = "";

        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
            debounceTimeoutRef.current = null;
        }
    };

    // Handle selecting a user from dropdown
    const handleSelectUser = (user: SkyboxFan) => {
        setSelectedUser(user);
        setSearchInput("");
        setIsDropdownOpen(false);
        setShowMinLengthMessage(false);
    };

    // Handle invite submission
    const handleInvite = () => {
        if (selectedUser) {
            onInvite(selectedUser);
            resetModalState();
            onClose();
        }
    };

    // Handle modal close with clean state
    const handleClose = () => {
        resetModalState();
        onClose();
    };

    /**
     * Handle input change - debounced search
     * @param e - The input change event
     * @returns
     */
    const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchInput(value);

        // Clear any existing timeout
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
            debounceTimeoutRef.current = null;
        }

        // Empty input handling
        if (!value.trim()) {
            setFilteredUsers([]);
            setIsDropdownOpen(false);
            setShowMinLengthMessage(false);
            previousQueryRef.current = "";
            return;
        }

        // Check if input is too short - show message but don't search
        const trimmedLength = value.trim().length;
        if (trimmedLength < MIN_SEARCH_LENGTH) {
            setShowMinLengthMessage(true);
            setFilteredUsers([]);
            setIsDropdownOpen(false);
            return; // Don't set a timeout - no search will happen
        }

        // Input is long enough, hide the message
        setShowMinLengthMessage(false);

        // Setup debounce for valid length input
        debounceTimeoutRef.current = setTimeout(() => {
            querySearchAutocomplete(value);
        }, 800); // 800ms debounce delay
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black bg-opacity-80 p-4 ">
            {/* @note remove overflow-hidden */}
            <div className="bg-[#1E1E1E] rounded-xl shadow-xl w-full max-w-md animate-fadeIn">
                {/* Header */}
                <div className="bg-[#272727] px-6 py-4 flex justify-between items-center">
                    <h3 className="text-xl text-white font-bold">
                        Invite to Skybox
                    </h3>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-white text-xl"
                    >
                        ×
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                    <p className="text-gray-300 mb-4">
                        Find a member to invite to your Skybox
                    </p>

                    {/* Search input area */}
                    <div className="bg-[#2A2A2A] rounded-lg p-3 mb-5 relative">
                        {selectedUser ? (
                            <div className="flex items-center justify-between bg-[#3A3A3A] rounded-lg p-2 mb-2">
                                <div className="flex items-center">
                                    {selectedUser.pfpUrl != "" && (
                                        <div className="w-8 h-8 rounded-full relative mr-2">
                                            <Image
                                                src={selectedUser.pfpUrl}
                                                unoptimized={
                                                    !selectedUser.pfpUrl.includes(
                                                        ".svg"
                                                    )
                                                }
                                                alt={selectedUser.name}
                                                layout="fill"
                                                objectFit="cover"
                                            />
                                        </div>
                                    )}
                                    <span className="text-white">
                                        {selectedUser.name}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    ×
                                </button>
                            </div>
                        ) : (
                            <div className="relative" ref={dropdownRef}>
                                <div className="flex items-center">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={searchInput}
                                        onChange={handleChangeInput}
                                        placeholder="Search for a member..."
                                        className="w-full bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                                    />
                                    {isLoading && (
                                        <div className="ml-2 flex-shrink-0">
                                            <div className="w-4 h-4 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>

                                {/* Minimum character message */}
                                {showMinLengthMessage && (
                                    <div className="text-xs text-gray-400 mt-1 animate-fadeIn">
                                        Type at least {MIN_SEARCH_LENGTH}{" "}
                                        characters to search
                                    </div>
                                )}

                                {/* Dropdown results */}
                                {isDropdownOpen && filteredUsers.length > 0 && (
                                    <div className="absolute left-0 right-0 mt-2 bg-[#2C2C2C] rounded-lg shadow-lg max-h-60 overflow-y-auto z-10 border border-[#444444]">
                                        {filteredUsers.map((user) => (
                                            <div
                                                key={user.id}
                                                className="flex items-center p-3 hover:bg-[#3A3A3A] cursor-pointer border-b border-[#444444] last:border-0"
                                                onClick={() =>
                                                    handleSelectUser(user)
                                                }
                                            >
                                                {/* @note remove overflow-hidden */}
                                                {user.pfpUrl != "" && (
                                                    <div className="w-10 h-10 rounded-full relative mr-3 flex-shrink-0">
                                                        <Image
                                                            src={user.pfpUrl}
                                                            unoptimized={
                                                                !user.pfpUrl.includes(
                                                                    ".svg"
                                                                )
                                                            }
                                                            alt={user.name}
                                                            layout="fill"
                                                            objectFit="cover"
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <div className="text-white font-medium">
                                                        {user.name}
                                                    </div>
                                                    {user.skyboxId != null && 
                                                    <div className="text-red-400 text-sm font-bold">
                                                        Already in a Skybox     
                                                    </div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Invite button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleInvite}
                            disabled={!selectedUser || selectedUser.skyboxId != null}
                            className={`px-6 py-2 rounded-lg text-white font-medium ${
                                !selectedUser || selectedUser.skyboxId != null
                                    ? "bg-[#444444] opacity-50 cursor-not-allowed"
                                    : "bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
                            }`}
                        >
                            Invite
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
