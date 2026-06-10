import axiosAuthClientInstance from "@/lib/axiosAuthClientInstance";
import { useGetUsersStore } from "@/store/useGetUsersStore";
import { SkyboxColor, useSkyboxStore } from "@/store/useSkyboxStore";
import { getSkyboxStreamAppApiEndpoint } from "@/utils/environmentUtil";
import { useToast } from "@chakra-ui/react";
import { ISkybox } from "@repo/interfaces";
import React, {
    Dispatch,
    SetStateAction,
    useEffect,
    useRef,
    useState,
} from "react";
import { colorNameToSkyboxColorMap, DEFAULT_SKYBOX_COLOR } from "./exampleData";

interface SkyboxColorBarIndicatorProps {
    previewColor?: SkyboxColor | null;
}

const MAX_SKYBOX_NAME_LENGTH = 22;

/**
 * SkyboxUserSettings component
 */
export const SkyboxUserSettings = ({}) => {
    const { showSettings, toggleSettings, selectedSkybox, setSelectedColor } =
        useSkyboxStore();
    const [skyboxName, setSkyboxName] = useState<string>("");
    const [editingSkyboxName, setEditingSkyboxName] = useState(false);
    const { users } = useGetUsersStore();
    const toast = useToast();

    const getOwnerDisplayName = () => {
        if (!selectedSkybox) {
            return "";
        }

        const foundUser = users.find(
            (user) =>
                user.id.toString() === selectedSkybox.ownerUserId.toString()
        );
        if (!foundUser) {
            return "";
        }

        return foundUser.name.toString();
    };

    /**
     * Handle Skybox name change
     * allows users to edit the skybox name with backward compatibility to reduce name for existing names that may exceed the limit
     * @returns
     */
    const handleSkyboxNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        // Only show warning if the user is trying to make the name longer beyond the limit
        if (
            newName.length > MAX_SKYBOX_NAME_LENGTH &&
            newName.length > skyboxName.length
        ) {
            toast({
                title: `Skybox name cannot exceed ${MAX_SKYBOX_NAME_LENGTH} characters`,
                status: "warning",
                duration: 3000,
                position: "top",
                isClosable: true,
            });
            return;
        }
        setSkyboxName(newName);
    };

    // Refs for input focus
    const skyboxNameInputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (editingSkyboxName && skyboxNameInputRef.current) {
            skyboxNameInputRef.current.focus();
        }
    }, [editingSkyboxName]);

    useEffect(() => {
        if (!selectedSkybox) {
            return;
        }

        setSkyboxName(selectedSkybox.skyboxName);

        let updatedSkyboxColor = DEFAULT_SKYBOX_COLOR;
        if (
            Object.keys(colorNameToSkyboxColorMap).includes(
                selectedSkybox.skyboxPrimaryColor
            )
        ) {
            updatedSkyboxColor =
                colorNameToSkyboxColorMap[selectedSkybox.skyboxPrimaryColor];
        }

        setSelectedColor(updatedSkyboxColor);
    }, [selectedSkybox]);

    return (
        <>
            <div className="w-full ">
                <h2 className="text-red-500 text-md font-bold mb-4">Name</h2>
                <div className="bg-[#333333] rounded-lg p-4">
                    {/* Skybox Name */}
                    <div className="flex justify-between items-center border-b border-[#444444] py-3">
                        <label className="text-white text-base whitespace-nowrap">
                            Skybox Name
                        </label>
                        <div className="flex items-center ml-4">
                            {editingSkyboxName ? (
                                <div
                                    className="flex flex-col bg-[#444444] rounded px-3 py-1"
                                    style={{ maxWidth: "200px" }}
                                >
                                    <div className="flex items-center">
                                        <input
                                            ref={skyboxNameInputRef}
                                            type="text"
                                            value={skyboxName}
                                            onChange={handleSkyboxNameChange}
                                            className="bg-transparent text-white text-base text-right focus:outline-none w-full"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter")
                                                    setEditingSkyboxName(false);
                                                if (e.key === "Escape")
                                                    setEditingSkyboxName(false);
                                            }}
                                            maxLength={MAX_SKYBOX_NAME_LENGTH}
                                        />
                                        <button
                                            onClick={() =>
                                                setEditingSkyboxName(false)
                                            }
                                            className="ml-2 text-blue-400 hover:text-blue-300 flex-shrink-0"
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
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="text-xs text-right text-gray-400 mt-1">
                                        {skyboxName.length}/
                                        {MAX_SKYBOX_NAME_LENGTH}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <span
                                        className="text-white text-base truncate max-w-[120px]"
                                        title={skyboxName}
                                    >
                                        {skyboxName}
                                    </span>
                                    <button
                                        onClick={() =>
                                            setEditingSkyboxName(true)
                                        }
                                        className="ml-2 text-gray-500 hover:text-white transition-colors"
                                        title="Edit Skybox Name"
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
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Owner - read-only */}
                    <div className="flex justify-between items-center py-3">
                        <label className="text-white text-base">Owner</label>
                        <div className="flex items-center">
                            <div
                                className="flex items-center"
                                style={{
                                    minWidth: "200px",
                                    justifyContent: "flex-end",
                                }}
                            >
                                <span className="text-white text-lg">
                                    {getOwnerDisplayName()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <SkyboxColorPicker
                skyboxName={skyboxName}
                setSkyboxName={setSkyboxName}
                onSave={() => {
                    setEditingSkyboxName(false);
                }}
                onCancel={() => {
                    setEditingSkyboxName(false);
                    if (!selectedSkybox) {
                        return;
                    }

                    setSkyboxName(selectedSkybox.skyboxName);
                }}
            />
        </>
    );
};

export const SkyboxColorPicker = ({
    skyboxName,
    setSkyboxName,
    onSave,
    onCancel,
}: {
    setSkyboxName: Dispatch<SetStateAction<string>>;
    skyboxName: string;
    onSave: () => void;
    onCancel: () => void;
}) => {
    const {
        colorOptions,
        selectedColor,
        activeColor,
        setSelectedColor,
        applySelectedColor,
        resetSelectedColor,
        toggleSettings,
        selectedSkybox,
        setSelectedSkybox,
        setChannelMembers,
        populateChannelMembers,
    } = useSkyboxStore();
    const toast = useToast();
    const { users } = useGetUsersStore();

    const hasChanges = Boolean(
        (selectedSkybox && selectedSkybox.skyboxName !== skyboxName) ||
            (selectedSkybox &&
                selectedColor &&
                selectedSkybox.skyboxPrimaryColor !== selectedColor.name)
    );

    // Handle color selection
    const handleColorSelect = (color: SkyboxColor) => {
        setSelectedColor(color);
    };

    // Handle save
    const handleSave = async () => {
        if (!selectedSkybox) {
            toast({
                title: "You must select a valid skybox",
                status: "error",
                duration: 5000,
                position: "top",
            });
            return;
        }

        if (!selectedColor) {
            toast({
                title: "Selected color is null",
                status: "error",
                duration: 5000,
                position: "top",
            });
            return;
        }

        if (!skyboxName) {
            toast({
                title: "Skybox name is invalid",
                status: "error",
                duration: 5000,
                position: "top",
            });
            return;
        }

        // Backwards compatibility allow users with already-long names to edit and save changes
        // Only block if they're trying to make it even longer
        if (
            skyboxName.length > MAX_SKYBOX_NAME_LENGTH &&
            (!selectedSkybox.skyboxName ||
                skyboxName.length > selectedSkybox.skyboxName.length)
        ) {
            toast({
                title: `Skybox name cannot exceed ${MAX_SKYBOX_NAME_LENGTH} characters`,
                description: `Current length: ${skyboxName.length} characters`,
                status: "error",
                duration: 5000,
                position: "top",
            });
            return;
        }

        const skyboxPrimaryColor = selectedColor.name;
        if (!hasChanges) {
            return;
        }

        try {
            const skyboxId = selectedSkybox._id!.toString();
            // Does not matter since we do not have a way to set url in frontend
            const skyboxLogoUrl = selectedSkybox.skyboxLogoUrl || "";
            var response = await axiosAuthClientInstance.put(
                `${getSkyboxStreamAppApiEndpoint()}/customize-skybox`,
                {
                    skyboxId,
                    skyboxName,
                    skyboxPrimaryColor,
                    skyboxLogoUrl,
                }
            );

            const customizeSkyboxResponse = response.data;
            if (!customizeSkyboxResponse.success) {
                toast({
                    title: customizeSkyboxResponse.errorMessage,
                    status: "error",
                    duration: 5000,
                    position: "top",
                });
                return;
            }

            const customizeSkyboxData = customizeSkyboxResponse.data;
            const skybox: ISkybox = customizeSkyboxData.skybox;
            const updatedSkyboxColor =
                colorNameToSkyboxColorMap[skybox.skyboxPrimaryColor];
            setSelectedSkybox(skybox);
            setSelectedColor(updatedSkyboxColor);
            applySelectedColor();
            setSkyboxName(skybox.skyboxName);
            populateChannelMembers(users, skybox);
            onSave();
            toast({
                title: `You have successfully customize your skybox, ${skybox.skyboxName}.`,
                status: "success",
                duration: 5000,
                position: "top",
            });
            return;
        } catch (e: any) {
            toast({
                title: "Opps! You have failed to customize skybox. Please try again in a few minutes.",
                status: "error",
                duration: 5000,
                position: "top",
            });
            return;
        }
    };

    // Handle cancel
    const handleCancel = () => {
        resetSelectedColor();
        toggleSettings(false);
        onCancel();
    };

    return (
        <div className="w-full relative ">
            <div className="relative z-10 flex flex-col min-h-[400px]">
                <div>
                    <h2 className="text-red-500 text-md font-bold mb-4">
                        Skybox Color
                    </h2>

                    <div className="bg-[#333333] rounded-lg p-4">
                        {/* Color grid */}
                        <div className="grid grid-cols-5 gap-2">
                            {colorOptions.map((color) => (
                                <button
                                    key={color.id}
                                    className={`rounded-lg py-2 px-1 transition-all flex items-center justify-center ${
                                        selectedColor &&
                                        selectedColor.id === color.id
                                            ? "ring-2 ring-white"
                                            : ""
                                    }`}
                                    style={{ backgroundColor: color.color }}
                                    onClick={() => handleColorSelect(color)}
                                >
                                    <span
                                        className={`text-sm font-normal ${
                                            [
                                                "White",
                                                "Gold",
                                                "Yellow",
                                            ].includes(color.name) &&
                                            color.color !== "#222222"
                                                ? "text-black"
                                                : "text-white"
                                        }`}
                                        style={{
                                            fontFamily: `var(--font-poppins-light)`,
                                        }}
                                    >
                                        &nbsp;
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Helper text */}
                    <p className="text-gray-400 mt-4 text-sm">
                        This color will be used for your Skybox and messages
                    </p>
                </div>

                {/* Spacer to push buttons to bottom */}
                <div className="flex-grow" />

                {/* Action buttons at the bottom with padding */}
                <div className="pt-4 pb-8 mt-auto">
                    <SkyboxActionButtons
                        selectedColor={selectedColor}
                        activeColor={activeColor}
                        hasChanges={hasChanges}
                        onSave={handleSave}
                        onCancel={handleCancel}
                    />
                </div>
            </div>
        </div>
    );
};

export const SkyboxColorIndicator = () => {
    // Get the active color from the store
    const { activeColor, selectedColor } = useSkyboxStore();

    if (!activeColor) return null;

    return (
        <div className="flex items-center space-x-2">
            <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: activeColor.color }}
            />
            <span className="text-white text-sm">{activeColor.name}</span>
        </div>
    );
};

export const SkyboxColorBarIndicator = ({
    previewColor,
}: SkyboxColorBarIndicatorProps) => {
    const { activeColor } = useSkyboxStore();

    // Use the preview color if provided, otherwise use the active color
    const displayColor = previewColor || activeColor;

    if (!displayColor) return null;

    return (
        <div
            className="w-full h-[4px] transition-colors duration-300"
            style={{ backgroundColor: displayColor.color }}
        ></div>
    );
};

interface SkyboxActionButtonsProps {
    selectedColor: SkyboxColor | null;
    activeColor: SkyboxColor | null;
    hasChanges: boolean;
    onSave: () => Promise<void>;
    onCancel: () => void;
}

export const SkyboxActionButtons: React.FC<SkyboxActionButtonsProps> = ({
    selectedColor,
    activeColor,
    hasChanges,
    onSave,
    onCancel,
}) => {
    const { toggleSettings } = useSkyboxStore();
    // const hasChanges = selectedColor && selectedColor !== activeColor;

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (isSaving) {
            return;
        }

        try {
            setIsSaving(true);
            await onSave();
            toggleSettings(false);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col items-center space-y-4 mt-2 pb-8 md:pb-16">
            <button
                className={`flex justify-center py-2 px-5 w-[200px] rounded-lg transition-all ${
                    !isSaving
                        ? "bg-gradient-to-r from-blue-400 to-blue-600 cursor-pointer"
                        : "bg-[#444444] opacity-50 cursor-not-allowed"
                }`}
                onClick={handleSave}
                disabled={isSaving}
            >
                {isSaving ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                ) : (
                    <div className="text-white text-lg font-semibold">
                        Save & Continue
                    </div>
                )}
            </button>
            <button
                className={`text-gray-400 text-lg font-semibold hover:text-gray-300 transition-colors px-5 py-2 `}
                onClick={onCancel}
                disabled={isSaving}
            >
                Cancel
            </button>
        </div>
    );
};
