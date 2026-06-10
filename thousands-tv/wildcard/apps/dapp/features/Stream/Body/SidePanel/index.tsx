import { Flex, VStack, Select, Box, Divider, Button, Slider, SliderTrack, SliderFilledTrack, SliderThumb, SliderMark } from "@chakra-ui/react";
import React, {
    Dispatch,
    ReactNode,
    SetStateAction,
    useEffect,
    useState,
} from "react";
import { useStreamControlContext } from "@/contexts/streamControlsContext";
import { getUserDisplayName } from "@/utils/streamUtils";
import { ICollectible, UserRole } from "@repo/interfaces";
import PubnubChat from "./PubnubChat";
import { useChannelMembers, usePresence } from "@pubnub/react-chat-components";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { useStreamContext } from "@/contexts/streamContext";

interface SidePanelProps {
    collectibles: ICollectible[];
    children?: ReactNode | ReactNode[];
}

const SidePanel = ({ collectibles, children }: SidePanelProps) => {
    const { userDB } = useWildfileUserContext();
    const { activeChannel, openLiveChatActions, liveChatActions, creditsToWager, setCreditsToWager, yourPollSelection, setYourPollSelection } = useStreamContext();
    const [presence] = usePresence({
        channels: [activeChannel.id],
        includeUUIDs: true,
    });
    const channelOccupants = presence[activeChannel.id]?.occupants;

    const [members, fetchPage, refetchChannelMembers, total, error, isLoading] =
        useChannelMembers({
            channel: activeChannel.id,
            include: {
                customUUIDFields: true,
                UUIDFields: true,
            },
        });

    //Check to see if the user has the role required to invite gues users up on stage.  This same role also grants the ability to remove guest users from stage.
    const canInviteUpOnStage: boolean =
        userDB?.roles.includes(UserRole.ORGANIZER) || false;

    const selectPollOption = (e: any, index: number, optionText: string) => {
        setYourPollSelection(optionText);
    };

    const renderLiveActionPanel = () => {
        if (yourPollSelection != "") {
            return (
                <>
                    <div style={{ textAlign: "center", marginTop: "20px" }}>
                        <p style={{ fontSize: "16px" }}>You selected: {yourPollSelection}</p>
                    </div>
                    <div style={{ textAlign: "center", marginTop: "20px", paddingBottom: "20px" }}>
                        <p style={{ fontSize: "12px", fontStyle: "italic" }}>Waiting for others to vote...</p>
                    </div>
                </>
            );
        } else {
            return (
                <>
                    <div style={{ textAlign: "center", marginTop: "20px" }}>
                        <p>How many credits to wager?</p>
                        <div style={{ marginTop: "20px", padding: "20px" }}>
                            <Slider aria-label="slider-credits-to-wager" min={100} max={1000} onChange={(val) => setCreditsToWager(val)}>
                                <SliderMark
                                    value={creditsToWager}
                                    textAlign="center"
                                    mt="-10"
                                    ml="-6"
                                    w="12"
                                >
                                    {creditsToWager}
                                </SliderMark>
                                <SliderTrack>
                                    <SliderFilledTrack />
                                </SliderTrack>
                                <SliderThumb></SliderThumb>
                            </Slider>
                        </div>
                    </div>
                    <div style={{ textAlign: "center", marginTop: "5px", paddingBottom: "20px" }}>
                        {liveChatActions[0].textOptions.map((row: any, index: number) => {
                            return (
                                <div key={index} style={{ marginBottom: "2px" }}>
                                    <Button onClick={(e) => selectPollOption(e, index, row)}>{row}</Button>
                                </div>
                            );
                        })}
                    </div>
                </>
            );
        }
    };

    const renderLiveAction = () => {
        if (!openLiveChatActions || liveChatActions.length < 1) {
            return (null);
        }

        return (
            <div style={{ backgroundColor: "#1e1e1e", width: "100%" }}>
                <div style={{ textAlign: "center", paddingTop: "20px" }}>
                    <p style={{ fontSize: "20px" }}>{liveChatActions[0].text}</p>
                </div>
                {renderLiveActionPanel()}
                <Divider borderBottomWidth={"1px"} backgroundColor={"#878787"} />
            </div>
        );
    };

    return (
        <VStack
            id={"side-panel"}
            sx={{
                alignItems: "flex-start",
                width: "100%",
                height: "100%",
                flexGrow: 1,
                gap: 0,
            }}
        >
            <PubnubChat
                {...{
                    channelOccupants,
                    members,
                }}
                canInviteUpOnStage={canInviteUpOnStage}
                collectibles={collectibles}
            />
            <Divider borderBottomWidth={"1px"} backgroundColor={"#1E1E1E"} />
            {renderLiveAction()}
        </VStack>
    );
};
export default SidePanel;
