import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNotificationStore } from "@/store/useNotificationStore";
import { TabContentPanel } from "./TabContentPanel";
import React, { useEffect, useRef, useState } from "react";
import { YourPredictions } from "../YourPredictions";
import { Flex } from "@chakra-ui/react";
import { VotingStreamApp } from "@/components/StreamApps/VotingStreamApp/VotingStreamApp";
import { useVotingStore } from "@/store/useVotingStore";
import { useBoostStore } from "@/store/useBoostStore";

interface TabCarouselProps {
    children?: React.ReactNode; // Children passed through (the input component)
}

// Predictions tab content wrapper
const PredictionsPanel = () => {
    return (
        <Flex>
            <YourPredictions />
        </Flex>
    );
};

/**
 * Tab Carousel - Displays a carousel of tabs with notifications and custom content. (wrapped around chat input)
 */
export const TabCarousel: React.FC<TabCarouselProps> = ({ children }) => {
    const {
        activeNotification,
        clearActiveNotification,
        activeTabIndex,
        setActiveTabIndex,
        updateTabContents,
    } = useNotificationStore();

    const { isMatchRunning } = useBoostStore();

    // Get state from voting store
    const { isTabVisible: isVotingTabActive } = useVotingStore();
    // Add a ref to track if a manual navigation just happened
    const manualNavigationRef = useRef<boolean>(false);

    const tabContents = React.useMemo(() => {
        const tabs = [];

        // Add Predictions tab if match is running
        if (isMatchRunning) {
            tabs.push({
                title: "Predictions",
                content: <PredictionsPanel />,
            });
        }

        // Add Voting tab if it's active
        if (isVotingTabActive) {
            tabs.push({
                title: "Voting",
                content: (
                    <Flex>
                        <VotingStreamApp />
                    </Flex>
                ),
            });
        }

        // Keep the store's tabContents in sync
        updateTabContents(tabs);
        return tabs;
    }, [isMatchRunning, isVotingTabActive, updateTabContents]);

    const [selectedTabType, setSelectedTabType] = useState<string | null>(null);

    // When activeTabIndex changes, update the selected tab type
    useEffect(() => {
        const currentTabTitle = tabContents[activeTabIndex]?.title;
        if (currentTabTitle) {
            setSelectedTabType(currentTabTitle);

            if (manualNavigationRef.current) {
                if (activeNotification?.tabTitle === currentTabTitle) {
                    clearActiveNotification();
                }
            }
        }
    }, [
        activeTabIndex,
        tabContents,
        activeNotification,
        clearActiveNotification,
    ]);

    // When tab contents change, find and select the tab with the right type
    useEffect(() => {
        if (!selectedTabType || tabContents.length === 0) return;

        // Find the index of the selected type in the new array
        const typeIndex = tabContents.findIndex(
            (tab) => tab.title === selectedTabType
        );

        if (typeIndex >= 0 && typeIndex !== activeTabIndex) {
            setActiveTabIndex(typeIndex);
        } else if (typeIndex === -1) {
            setActiveTabIndex(0);
        }
    }, [tabContents, selectedTabType, activeTabIndex, setActiveTabIndex]);

    useEffect(() => {
        if (!selectedTabType && tabContents.length > 0) {
            setSelectedTabType(tabContents[0].title);
        }
    }, [selectedTabType, tabContents]);

    // Update when manual navigation occurs
    useEffect(() => {
        // Reset the manual navigation flag after a short delay
        if (manualNavigationRef.current) {
            const timer = setTimeout(() => {
                manualNavigationRef.current = false;
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [activeTabIndex]);

    // Update navigation handlers to set the manual flag
    const handlePrevTab = () => {
        manualNavigationRef.current = true;
        if (activeTabIndex > 0) {
            const prevTabTitle = tabContents[activeTabIndex - 1]?.title;
            if (prevTabTitle) {
                setSelectedTabType(prevTabTitle);
            }
            setActiveTabIndex(activeTabIndex - 1);
        }
    };

    const totalTabs = tabContents.length;

    const handleNextTab = () => {
        manualNavigationRef.current = true;
        // Only move to next if not at the last tab
        if (activeTabIndex < totalTabs - 1) {
            const nextTabTitle = tabContents[activeTabIndex + 1]?.title;
            if (nextTabTitle) {
                setSelectedTabType(nextTabTitle);
            }
            setActiveTabIndex(activeTabIndex + 1);
        }
    };

    const renderTabNavigationCarouselJSX = () => {
        if (!isMatchRunning && !isVotingTabActive) {
            return <></>;
        }

        return (
            <>
                {/* Dot Indicators with navigation buttons spread across width */}
                <div className="flex justify-between items-center py-0 w-full bg-zinc-900 p-0 m-0">
                    {/* Left navigation button */}
                    <div className="flex-none ml-1">
                        <button
                            className={`p-0.5 flex items-center justify-center ${
                                activeTabIndex === 0
                                    ? "text-gray-600 cursor-not-allowed bg-zinc-900"
                                    : "text-gray-400 hover:bg-zinc-800 bg-zinc-950"
                            } rounded-full transition-colors`}
                            onClick={handlePrevTab}
                            disabled={activeTabIndex === 0}
                        >
                            <ChevronLeft size={16} />
                        </button>
                    </div>

                    {/* Centered indicators */}
                    <div className="flex justify-center items-center space-x-2 h-6">
                        {Array.from({ length: totalTabs }).map((_, index) => (
                            <motion.div
                                key={index}
                                className={`w-2 h-2 rounded-full cursor-pointer ${
                                    index === activeTabIndex
                                        ? "bg-white"
                                        : "bg-zinc-500" // Always gray for inactive tabs
                                }`}
                                onClick={() => {
                                    manualNavigationRef.current = true;

                                    const newTabTitle =
                                        tabContents[index]?.title;
                                    if (newTabTitle) {
                                        setSelectedTabType(newTabTitle);
                                    }
                                    setActiveTabIndex(index);
                                }}
                                whileTap={{ scale: 0.9 }}
                                whileHover={{ scale: 1.2 }}
                            />
                        ))}
                    </div>

                    {/* Right navigation button */}
                    <div className="flex-none mr-1">
                        <button
                            className={`p-0.5 flex items-center justify-center ${
                                activeTabIndex === totalTabs - 1
                                    ? "text-gray-600 cursor-not-allowed bg-zinc-900"
                                    : "text-gray-400 hover:bg-zinc-800 bg-zinc-950"
                            } rounded-full transition-colors`}
                            onClick={handleNextTab}
                            disabled={activeTabIndex === totalTabs - 1}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className="flex flex-col w-full text-white relative p-0 m-0 ">
            {/* Content Panel */}
            <div className="overflow-visible">
                <TabContentPanel
                    tabContents={tabContents}
                    setSelectedTabType={setSelectedTabType}
                    setActiveTabIndex={setActiveTabIndex}
                    manualNavigationRef={manualNavigationRef}
                />
            </div>

            {/* Tab Navigation with more compact layout */}
            <div
                className={`bg-zinc-900 overflow-visible relative flex flex-col  ${
                    isMatchRunning ? "pt-0 pb-0" : "pt-2 pb-0"
                }`}
            >
                {renderTabNavigationCarouselJSX()}
                {/* Chat message input - reduced vertical spacing */}
                <div className="flex items-center pt-0.5 pb-2">
                    {/* Chat message input passed as child */}
                    <div className="grow mx-1 relative z-50">{children}</div>
                </div>
            </div>
        </div>
    );
};
