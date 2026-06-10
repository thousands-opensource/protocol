import React, { useRef, useEffect } from "react";
import { SkyboxUserSettings } from "./SkyboxUserSettings";
import { useSkyboxStore } from "@/store/useSkyboxStore";
import SkyboxMembers from "./SkyboxMembers";
import { Chat } from "@pubnub/chat";
import { useVotingStore } from "@/store/useVotingStore";
import { useBoostStore } from "@/store/useBoostStore";

function SkyboxLayout() {
    const { showSettings, toggleSettings } = useSkyboxStore();
    const { selectedSkybox } = useSkyboxStore();
    const contentRef = useRef<HTMLDivElement>(null);

    const { isTabVisible: isVotingTabActive } = useVotingStore();
    const { isMatchRunning } = useBoostStore();

    // Check if tab carousel is active (either voting or match is running)
    const isTabCarouselActive = isVotingTabActive || isMatchRunning;

    // Utility function to get the appropriate class for skybox height
    const getSkyboxViewportHeight = () => {
        return isTabCarouselActive
            ? "max-h-[40vh] md:max-h-[70vh] overflow-y-auto"
            : "max-h-[60vh] md:max-h-[80vh] overflow-y-auto";
    };

    /**
     * Effect to check if content is overflowing and apply overflow styles
     * Actively checks the content height and applies overflow styles if necessary.
     * @dev - This is useful for ensuring that the content area can scroll if it exceeds the viewport height.
     */
    useEffect(() => {
        const checkOverflow = () => {
            if (contentRef.current) {
                const isOverflowing =
                    contentRef.current.scrollHeight >
                    contentRef.current.clientHeight;
                if (isOverflowing) {
                    contentRef.current.classList.add("overflow-y-auto");
                }
            }
        };
        checkOverflow();
        window.addEventListener("resize", checkOverflow);

        return () => {
            window.removeEventListener("resize", checkOverflow);
        };
    }, [showSettings, isTabCarouselActive]);

    return (
        // Conditionally apply overflow based on settings state
        <div
            ref={contentRef}
            className={`${getSkyboxViewportHeight()} ${
                showSettings ? "overflow-auto" : "overflow-y-hidden"
            } overflow-x-hidden `}
            style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#4a4a4a transparent",
            }}
        >
            <div className="p-2 pt-2  pb-0 flex flex-col ">
                <div className="z-10 bg-[#212121]">
                    <SkyboxMembers
                        onOpenSettings={() => toggleSettings()}
                        teamName={selectedSkybox?.skyboxName}
                    />
                </div>
                {/* Settings panel with animation - positioned below SkyboxMembers */}
                <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden
            ${
                showSettings
                    ? "max-h-[1000px] opacity-100"
                    : "max-h-0 opacity-0 mt-0"
            }`}
                    style={{
                        transitionProperty: "max-height, opacity, margin",
                    }}
                >
                    <div className="flex flex-col space-y-10">
                        <SkyboxUserSettings />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SkyboxLayout;
