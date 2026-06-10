import PubNubPinnedMessage from "@/components/PubNub/Chat/PinnedMessage";
import { useSkyboxStore } from "@/store/useSkyboxStore";
import { useVotingStore } from "@/store/useVotingStore";
import { useBoostStore } from "@/store/useBoostStore";
import { Spinner } from "@chakra-ui/react";
import { Message, ThreadChannel, ThreadMessage } from "@pubnub/chat";
import { RefObject } from "react";
import { skyboxTierToMembership } from "@/features/Skybox/types";

interface PubnubChatProps {
    renderMessages: (messages: Message[]) => JSX.Element[];
    handleScroll: () => void;
    chatContainerRef: RefObject<HTMLDivElement>;
    messagesEndRef: RefObject<HTMLDivElement>;
    loading: boolean;
    pinMessage: Message | null;
    onUnpinMessage: () => void;
    tempThreadChannel: ThreadChannel | null;
    threadChannel: ThreadChannel | null;
    chatHistory: Message[];
    history: Message[] | ThreadMessage[];
    userId: String | null;
}

/**
 * PubnubChat - Chat component that displays messages
 */
const PubnubChat = ({
    loading,
    messagesEndRef,
    pinMessage,
    renderMessages,
    onUnpinMessage,
    chatHistory,
    history,
    tempThreadChannel,
    threadChannel,
    chatContainerRef,
    handleScroll,
    userId,
}: PubnubChatProps) => {
    const { isSkyboxesVisible, showSkybox, selectedSkybox, generalSkybox } =
        useSkyboxStore();
    const { isTabVisible: isVotingTabActive } = useVotingStore();
    const { isMatchRunning } = useBoostStore();

    const selectedSkyboxUserId = selectedSkybox?.ownerUserId.toString() || "";
    const isCurrentUserSkyboxOwner = selectedSkyboxUserId === userId;

    // Check if tab carousel is active (either voting or match is running)
    const isTabCarouselActive = isVotingTabActive || isMatchRunning;

    /**
     * Calculates the appropriate height class based on UI state combinations
     * Handles different viewport based on whether skybox or tab carousel is active
     * Using dynamic viewport height (dvh) for better mobile experience
     */
    const getInputHeightClassname = () => {
        // Handle different combinations of states

        const isInPrivateSkyboxViewAndShowSkybox =
            isSkyboxesVisible && showSkybox;

        const isInPrivateSkyBoxView = isSkyboxesVisible && !showSkybox;

        const maxMembers =
            selectedSkybox &&
            selectedSkybox?._id?.toString() !== generalSkybox?._id?.toString()
                ? skyboxTierToMembership[selectedSkybox.skyboxTier]
                : 0;

        if (isInPrivateSkyboxViewAndShowSkybox && isTabCarouselActive) {
            // Only skybox is active
            if (maxMembers > 10) {
                return "h-fit max-h-[calc(70dvh_-_450px)] md:max-h-[calc(100dvh_-_475px)]";
            }

            return "h-fit max-h-[calc(70dvh_-_395px)] md:max-h-[calc(100dvh_-_430px)]";
        } else if (isInPrivateSkyboxViewAndShowSkybox) {
            if (maxMembers > 10) {
                return "h-fit max-h-[calc(70dvh_-_280px)] md:max-h-[calc(100dvh_-_300px)]";
            }

            return "h-fit max-h-[calc(70dvh_-_235px)] md:max-h-[calc(100dvh_-_270px)]";
        }

        if (isSkyboxesVisible && isTabCarouselActive) {
            // Both skybox and tabs are active - least space available
            return "h-fit max-h-[calc(70dvh_-_280px)] md:max-h-[calc(100dvh_-_330px)]";
        } else if (isInPrivateSkyBoxView) {
            return "h-fit max-h-[calc(70dvh_-_105px)] md:max-h-[calc(100dvh_-_165px)]";
        } else if (isSkyboxesVisible) {
            // Only skybox is active
            return "h-fit max-h-[calc(70dvh_-_215px)] md:max-h-[calc(100dvh_-_0px)]";
        } else if (isTabCarouselActive) {
            // Only skybox is active
            return "h-fit max-h-[calc(60dvh_-_150px)] md:max-h-[calc(100dvh_-_290px)]";
        } else {
            // Nothing special active - most space available
            return "max-h-[calc(80dvh_-_162px)] md:max-h-[calc(100dvh_-0px)]";
        }
    };

    return (
        <div
            id="message-list"
            ref={chatContainerRef}
            onScroll={handleScroll}
            className={` overflow-x-hidden pt-4  
               ${getInputHeightClassname()} 
                `}
        >
            {/* <Virtuoso
                totalCount={chatHistory.length}
                data={chatHistory}
                itemContent={(index, message) => {
                    return (
                        <PubNubMessage
                            key={index}
                            message={message}
                            showMenu={showMenu}
                            setShowMenu={setShowMenu}
                            setCoordinates={setCoordinates}
                            setCurrentMessage={setCurrentMessage}
                            onUpdateHistory={
                                threadChannel || tempThreadChannel
                                    ? handleHistoryUpdate
                                    : onUpdateHistory
                            }
                            onSetReplyingTo={setReplyingTo}
                            onSetReplyingToUser={setReplyingToUser}
                            onSetThreadChannel={setThreadChannel}
                            handleReaction={handleReaction}
                            setTimetoken={setTimetoken}
                            replyTimetoken={timetoken}
                        />
                    );
                }}
            /> */}
            {pinMessage && (
                <PubNubPinnedMessage
                    message={pinMessage}
                    onUnpinMessage={onUnpinMessage}
                />
            )}
            {loading && (
                <div className="flex w-full justify-center pb-1">
                    <Spinner className="text-center w-full" color="info" />
                </div>
            )}
            {renderMessages(
                threadChannel || tempThreadChannel ? history : chatHistory
            )}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default PubnubChat;
