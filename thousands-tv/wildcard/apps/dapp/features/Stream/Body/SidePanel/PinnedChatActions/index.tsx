import { Button, Flex } from "@chakra-ui/react";
import PinnedChatAction from "./PinnedChatAction";
import { useEffect, useState } from "react";
import { ChevronRightIcon, ChevronLeftIcon } from "@chakra-ui/icons";
import { useStreamContext } from "@/contexts/streamContext";
import { THEME_COLOR_CLOUD_GREY } from "@/constants/constants";

interface PinnedChatActions {}

const MOCK_PINNED_CHAT_ACTIONS = [
    {
        _id: "c-1",
        command: "cheer",
        text: "Will Bolgar score before the goalie repawns",
        duration: "00:59",
        credit: 500,
        icon: "/images/wca-1.svg",
        type: "system-yesno",
    },
    {
        _id: "c-2",
        command: "cry",
        text: "Will Bolgar score before the goalie repawns",
        duration: "1:10",
        credit: 750,
        icon: "/images/wca-1.svg",
        type: "system-yesno",
    },
    {
        _id: "c-3",
        command: "wave",
        text: "Will Bolgar score before the goalie repawns",
        duration: "1:15",
        credit: 250,
        icon: "/images/wca-1.svg",
        type: "system-join",
    },
    {
        _id: "c-4",
        command: "shout",
        text: "Will Bolgar score before the goalie repawns",
        duration: "1:20",
        credit: 777,
        icon: "/images/wca-1.svg",
        type: "system-join",
    },
    {
        _id: "c-5",
        command: "throw",
        text: "Will Bolgar score before the goalie repawns",
        duration: "1:25",
        credit: 888,
        icon: "/images/wca-1.svg",
        type: "system-join",
    },
    {
        _id: "c-6",
        command: "fear",
        text: "Will Bolgar score before the goalie repawns",
        duration: "1:30",
        credit: 1000,
        icon: "/images/wca-1.svg",
        type: "system-join",
    },
];

const PinnedChatActions = () => {
    const visibleItems = 2;
    const [startIndex, setStartIndex] = useState<number>(0);
    const [isLeftDisabled, setIsLeftDisabled] = useState<boolean>(true);
    const [isRightDisabled, setIsRightDisabled] = useState<boolean>(false);

    const nextPinnedChatAction = () => {
        setStartIndex((prevIndex) =>
            Math.min(
                prevIndex + 1,
                MOCK_PINNED_CHAT_ACTIONS.length - visibleItems
            )
        );
    };

    const prevPinnedChatAction = () => {
        setStartIndex((prevIndex) => Math.max(prevIndex - 1, 0));
    };

    useEffect(() => {
        setIsLeftDisabled(startIndex === 0);
        setIsRightDisabled(
            startIndex >= MOCK_PINNED_CHAT_ACTIONS.length - visibleItems
        );
    }, [startIndex, visibleItems]);

    const visiblePinnedChatActions = MOCK_PINNED_CHAT_ACTIONS.slice(
        startIndex,
        startIndex + visibleItems
    );

    return (
        <Flex
            sx={{
                py: 3,
                gap: 1,
                alignItems: "center",
                minHeight: "40px",
                backgroundColor: "#231E32",
                borderTop: `1px solid ${THEME_COLOR_CLOUD_GREY}`,
                borderBOTTOM: `1px solid ${THEME_COLOR_CLOUD_GREY}`,
            }}
        >
            <Button
                onClick={prevPinnedChatAction}
                disabled={isLeftDisabled}
                size={"xs"}
                sx={{
                    bg: "transparent",
                    _hover: {
                        // bg: "transparent",
                        bg: "var(--chakra-colors-whiteAlpha-700)",
                    },
                    cursor: isLeftDisabled ? "not-allowed" : "pointer",
                    opacity: isLeftDisabled ? 0.3 : 1,
                    borderRadius: "full",
                    width: "8px",
                    minWidth: "8px",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mr: "2px",
                    ml: "2px",
                }}
            >
                <ChevronLeftIcon boxSize={4} />
            </Button>
            <Flex
                sx={{
                    w: "100%",
                    gap: 1,
                    alignItems: "center",
                }}
            >
                {visiblePinnedChatActions.map((pca: any) => {
                    return <PinnedChatAction key={pca._id} pca={pca} />;
                })}
            </Flex>
            <Button
                onClick={nextPinnedChatAction}
                size={"xs"}
                disabled={isRightDisabled}
                sx={{
                    bg: "transparent",
                    _hover: {
                        // bg: "transparent",
                        bg: "var(--chakra-colors-whiteAlpha-700)",
                    },
                    cursor: isRightDisabled ? "not-allowed" : "pointer",
                    opacity: isRightDisabled ? 0.3 : 1,
                    borderRadius: "full",
                    width: "8px",
                    minWidth: "8px",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mr: "2px",
                    ml: "2px",
                }}
            >
                <ChevronRightIcon boxSize={4} />
            </Button>
        </Flex>
    );
};

export default PinnedChatActions;
