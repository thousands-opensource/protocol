import React from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import {
    containerSx,
    leftAppControl,
    rightAppControl,
    boostsHeaderSx,
    boostButtonsContainerSx,
} from "./styles";
import { azeretMonoMedium, poppinsRegular } from "@/utils/themeUtil";
import UserPointMetrics from "./UserPointMetrics";
import PointMultiplierButton from "./PointMultiplierButton";
import { BoostButtonAttributesMap } from "@/features/Event/constants";
import { ActiveBoost } from "@/features/Event/types";
import ActiveBoosts from "@/features/Event/EventsSeries/ChatAppControl/ActiveBoosts";
import { ChatApp } from "@repo/interfaces";
import ChatAppIdleGameProvider, {
    useChatAppIdleGameContext,
} from "@/contexts/chatAppIdleGameContext";
import { useGlobalContext } from "@/contexts/globalContext";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { useChatAppIdleGameBidButtonContext } from "@/contexts/chatAppIdleGameBidButtonContext";
import { useConfirmationContext } from "@/contexts/confirmationContext";
import { useStreamContext } from "@/contexts/streamContext";
import PlaceOrderPopup from "@/features/Stream/PlaceOrderPopup";
import { useChatAppLeaderboardStore } from "@/store/useChatAppLeaderboardStore";

interface ChatAppControlProps {
    // totalPoints: number;
    // pointsPerSecond: string;
    // credits: number;
    // button1cost: number;
    // button2cost: number;
    // button3cost: number;
    button1seconds: number;
    button2seconds: number;
    button3seconds: number;
    // rank: number;
    // onButtonClick: (command: string) => void;
    // activeBoosts: ActiveBoost[];
    // openPopup: boolean;
    // chatApp: ChatApp;
    children?: React.ReactNode;
}

const BOOST_VALUES = [1.1, 1.5, 2];

const renderCreditsIconJSX = () => (
    <Box
        as="img"
        src="/images/ChatAppControl/credits-icon.svg"
        alt="credits icon"
        width="9pt"
        height="9pt"
        sx={{ marginBottom: "1px" }}
    />
);

// Render the Boosts Header
const renderBoostsHeaderJSX = (credits: number) => (
    <Flex sx={boostsHeaderSx}>
        <Text fontSize="8pt" className={poppinsRegular.className}>
            Boosts
        </Text>
        <Flex alignItems="center" gap={1}>
            <Text fontSize="11pt" className={azeretMonoMedium.className}>
                {credits}
            </Text>
            {renderCreditsIconJSX()}
        </Flex>
    </Flex>
);

// Render Boost Buttons
const renderBoostButtonsJSX = (
    buttonCosts: number[],
    buttonSeconds: number[],
    onButtonClick: (command: string) => void
) => (
    <Flex sx={boostButtonsContainerSx}>
        {BOOST_VALUES.map((boostValue, index) => (
            <PointMultiplierButton
                command={`button_${boostValue}x`}
                key={index}
                multiplier={boostValue}
                buttonCost={buttonCosts[index]}
                buttonSeconds={buttonSeconds[index]}
                onClick={onButtonClick}
                background={BoostButtonAttributesMap[boostValue].background}
                borderColor={BoostButtonAttributesMap[boostValue].borderColor}
            />
        ))}
    </Flex>
);

const ChatAppControl: React.FC<ChatAppControlProps> = ({
    // totalPoints,
    // pointsPerSecond,
    // credits,
    // button1cost,
    // button2cost,
    // button3cost,
    button1seconds,
    button2seconds,
    button3seconds,
    // rank,
    // onButtonClick,
    // activeBoosts,
    // openPopup,
    // chatApp,
    children,
}) => {
    const { chatApp } = useStreamContext();
    const {
        openPopup,
        setIsLoadingConfirmation,
        setPopupMessage,
        setOpenPopup,
    } = useConfirmationContext();
    const { currentUserRank } = useChatAppLeaderboardStore();
    const { pointsPerSecond, personalCredit } = useChatAppIdleGameContext();
    const {
        button1Cost,
        button2Cost,
        button3Cost,
        fetchChatActionPriceQuote,
        activeBoosts,
        handleConfirmChatAction,
    } = useChatAppIdleGameBidButtonContext();
    const { creditBalance: credits } = useWildfileUserContext();
    const buttonCosts = [button1Cost, button2Cost, button3Cost];
    const buttonSeconds = [button1seconds, button2seconds, button3seconds];

    if (chatApp !== ChatApp.WILDCARD) {
        return null;
    }

    return (
        <Flex flexDirection={"column"}>
            <ActiveBoosts activeBoosts={activeBoosts} />

            <Flex sx={containerSx}>
                {/* UserPointMetrics Container */}
                {openPopup ? (
                    <PlaceOrderPopup handleConfirm={handleConfirmChatAction} />
                ) : (
                    <>
                        <Box sx={leftAppControl}>
                            <UserPointMetrics
                                totalPoints={Math.floor(personalCredit)}
                                pointsPerSecond={pointsPerSecond
                                    .toFixed(1)
                                    .toString()}
                                rank={currentUserRank}
                            />
                        </Box>

                        {/* Boosts Container */}
                        <Flex sx={rightAppControl}>
                            {renderBoostsHeaderJSX(credits)}
                            {renderBoostButtonsJSX(
                                buttonCosts,
                                buttonSeconds,
                                fetchChatActionPriceQuote
                            )}
                        </Flex>
                    </>
                )}
            </Flex>
        </Flex>
    );
};

export default ChatAppControl;
