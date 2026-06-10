import { useNotificationStore } from "@/store/useNotificationStore";
import { useBoostStore } from "@/store/useBoostStore";
import { useVotingStore } from "@/store/useVotingStore";
import React, { useEffect, useState, useRef } from "react";
import { ToastContainer } from "../Notifications/ToastNotification";

interface TabContentPanelProps {
    tabContents: Array<{ title: string; content?: React.ReactNode }>;
    setSelectedTabType?: (tabTitle: string) => void;
    setActiveTabIndex?: (index: number) => void;
    manualNavigationRef?: React.MutableRefObject<boolean>;
}

/**
 * Contains the content for each tab in the carousel.
 */
export const TabContentPanel: React.FC<TabContentPanelProps> = ({
    tabContents,
    setSelectedTabType,
    setActiveTabIndex,
    manualNavigationRef,
}) => {
    const { activeTabIndex, setActiveTabIndex: setStoreActiveTabIndex } =
        useNotificationStore();

    const { isMatchRunning } = useBoostStore();
    const { isTabVisible: isVotingTabActive } = useVotingStore();
    const [topBorderColorRedComponent, setTopBorderColorRedComponent] =
        useState(0);
    const [topBorderColorGreenComponent, setTopBorderColorGreenComponent] =
        useState(102);
    const [topBorderColorBlueComponent, setTopBorderColorBlueComponent] =
        useState(255);

    // The active tab content and title
    const content = tabContents[activeTabIndex] || {
        title: "",
        content: <></>,
    };
    const activeTabTitle = content.title;

    // And update the handleNotificationClick function:
    const handleNotificationClick = (tabTitle: string) => {
        // Find the tab index with the matching title
        const tabIndex = tabContents.findIndex((tab) => tab.title === tabTitle);

        // Only navigate if the tab exists
        if (tabIndex !== -1) {
            // Set manual navigation flag if available
            if (manualNavigationRef) {
                manualNavigationRef.current = true;
            }

            setStoreActiveTabIndex(tabIndex);

            if (setActiveTabIndex) {
                setActiveTabIndex(tabIndex);
            }

            if (setSelectedTabType) {
                setSelectedTabType(tabTitle);
            }
        }
    };

    useEffect(() => {
        if (tabContents[activeTabIndex]?.title == "Voting") {
            setTopBorderColorRedComponent(255);
            setTopBorderColorGreenComponent(0);
            setTopBorderColorBlueComponent(0);
        } else {
            setTopBorderColorRedComponent(0);
            setTopBorderColorGreenComponent(102);
            setTopBorderColorBlueComponent(255);
        }
    }, [activeTabIndex]);

    if (!isMatchRunning && !isVotingTabActive) {
        return null;
    }

    return (
        <div className="relative">
            {/* Toast Notification Container */}
            <div className="relative z-10">
                <ToastContainer
                    onNotificationClick={handleNotificationClick}
                    activeTabTitle={activeTabTitle}
                />
            </div>

            {/* Enhanced upward glow effect from the blue/red line */}
            <div
                className="absolute w-full h-12 -top-12 left-0 pointer-events-none"
                style={{
                    background: `
                    linear-gradient(to top, 
                    rgba(${topBorderColorRedComponent}, ${topBorderColorGreenComponent}, ${topBorderColorBlueComponent}, 0.7) 0%, 
                    rgba(${topBorderColorRedComponent}, ${topBorderColorGreenComponent}, ${topBorderColorBlueComponent}, 0.4) 30%, 
                    rgba(${topBorderColorRedComponent}, ${topBorderColorGreenComponent}, ${topBorderColorBlueComponent}, 0.2) 60%, 
                    rgba(${topBorderColorRedComponent}, ${topBorderColorGreenComponent}, ${topBorderColorBlueComponent}, 0.05) 85%, 
                    transparent 100%)`,
                }}
            />

            <div
                className={`p-1 px-2 rounded flex flex-col min-h-[150px] overflow-y-auto border-0 bg-[#101010] relative
                before:content-[''] before:absolute before:bottom-[40px] before:left-0 before:w-3/4 before:h-full 
                before:bg-[radial-gradient(circle_at_top_left,_rgba(33,33,33,0.6)_0%,_rgba(33,33,33,0.45)_15%,_rgba(25,25,25,0.25)_35%,_rgba(20,20,20,0.15)_45%,_rgba(15,15,15,0.08)_55%,_rgba(10,10,10,0.05)_65%,_rgba(5,5,5,0.02)_75%,_rgba(0,0,0,0.01)_85%,_transparent_100%)] 
                before:rounded-tl before:pointer-events-none`}
                style={{
                    borderTop: `2px solid rgba(${topBorderColorRedComponent}, ${topBorderColorGreenComponent}, ${topBorderColorBlueComponent}, 0.9)`,
                    zIndex: 1,
                }}
            >
                {/* Render custom content if provided, otherwise use default container */}
                {content.content ? (
                    content.content
                ) : (
                    <div className="flex-1">
                        <></>
                    </div>
                )}
            </div>
        </div>
    );
};
