import React, { useEffect, useState } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { containerSx } from "../styles";
import { poppinsBold, poppinsMedium } from "@/utils/themeUtil";
import { BoostButtonAttributesMap } from "@/features/Event/constants";
import { ActiveBoost } from "@/features/Event/types";
import { useStreamContext } from "@/contexts/streamContext";
import { useChatAppIdleGameContext } from "@/contexts/chatAppIdleGameContext";

interface ActiveBoostsProps {
    activeBoosts: ActiveBoost[];
}

interface BoostItemProps {
    multiplier: number;
    duration: number;
    expiration: number;
}
// Render Individual Boost Item
const BoostItem = ({ multiplier, duration, expiration }: BoostItemProps) => {
    const { dateTimeOffsetRef } = useChatAppIdleGameContext();
    const [timeLeft, setTimeLeft] = useState<number>(
        Math.floor(duration / 1000)
    );

    useEffect(() => {
        if (!dateTimeOffsetRef || !dateTimeOffsetRef.current) {
            console.error("dateTimeOffsetRef.current is null");
            return;
        }

        const timer = setInterval(() => {
            const adjustedTime = Date.now() + dateTimeOffsetRef.current;
            const adjustedTimeSec = Math.floor(adjustedTime / 1000);
            const expirationSec = Math.floor(expiration / 1000);

            setTimeLeft(expirationSec - adjustedTimeSec);
            if (adjustedTimeSec >= expirationSec) {
                setTimeLeft(0);
                clearInterval(timer);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    return (
        <Flex
            key={`${multiplier}-${duration}`}
            flexDirection={"column"}
            alignItems="center"
            gap={"3px"}
        >
            <Flex
                alignItems="center"
                justifyContent="center"
                sx={{
                    borderRadius: "6px",
                    padding: "4px 6px",
                    background: BoostButtonAttributesMap[multiplier].background,
                    border: `1px solid ${BoostButtonAttributesMap[multiplier].borderColor}`,
                    height: "18pt",
                    width: "28pt",
                }}
            >
                <Text
                    fontSize="12pt"
                    className={poppinsBold.className}
                    lineHeight="1"
                    textAlign="center"
                >
                    {multiplier}
                </Text>
                <Text
                    fontSize="10pt"
                    className={poppinsBold.className}
                    lineHeight="1"
                    position="relative"
                    top="1px"
                >
                    x
                </Text>
            </Flex>
            <Flex>
                <Text
                    fontSize="8pt"
                    color="#FF6A45"
                    className={poppinsMedium.className}
                    lineHeight="1"
                >
                    {/* {timeLeft >= 60 ? Math.floor(timeLeft / 60) : ""}:
                    {String(timeLeft % 60).padStart(2, "0")} */}
                    {timeLeft}
                </Text>
            </Flex>
        </Flex>
    );
};

// Render Individual Boost Item
const renderBoostItemJSX = (multiplier: number, duration: number) => (
    <Flex
        key={`${multiplier}-${duration}`}
        flexDirection={"column"}
        alignItems="center"
        gap={"3px"}
    >
        <Flex
            alignItems="center"
            justifyContent="center"
            sx={{
                borderRadius: "6px",
                padding: "4px 6px",
                background: BoostButtonAttributesMap[multiplier].background,
                border: `1px solid ${BoostButtonAttributesMap[multiplier].borderColor}`,
                height: "18pt",
                width: "28pt",
            }}
        >
            <Text
                fontSize="12pt"
                className={poppinsBold.className}
                lineHeight="1"
                textAlign="center"
            >
                {multiplier}
            </Text>
            <Text
                fontSize="10pt"
                className={poppinsBold.className}
                lineHeight="1"
                position="relative"
                top="1px"
            >
                x
            </Text>
        </Flex>
        <Flex>
            <Text
                fontSize="8pt"
                color="#FF6A45"
                className={poppinsMedium.className}
                lineHeight="1"
            >
                {duration >= 60 ? Math.floor(duration / 60) : ""}:
                {String(duration % 60).padStart(2, "0")}
            </Text>
        </Flex>
    </Flex>
);

// Render Active Boosts List
const renderActiveBoostsListJSX = (activeBoosts: ActiveBoost[]) => {
    return (
        <Flex
            flexWrap="wrap"
            gap="6px"
            justifyContent="flex-start"
            alignItems="center"
            overflow="hidden"
        >
            {activeBoosts.map((activeBoost) => {
                return (
                    <BoostItem
                        key={activeBoost.chatActionGuid}
                        multiplier={activeBoost.boostValue}
                        duration={activeBoost.duration}
                        expiration={activeBoost.expiration}
                    />
                );
            })}
        </Flex>
    );
};

const ActiveBoosts: React.FC<ActiveBoostsProps> = ({ activeBoosts }) => {
    return (
        <Flex
            sx={{
                ...containerSx, // Match the width of the ChatAppControl
                background: "transparent", // Transparent background
                height: "45px", // Remove height restrictions
            }}
            flexDirection="column"
            padding="3px 10px"
        >
            {renderActiveBoostsListJSX(activeBoosts)}
        </Flex>
    );
};

export default ActiveBoosts;
