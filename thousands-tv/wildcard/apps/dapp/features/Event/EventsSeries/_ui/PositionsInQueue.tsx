import { COOKIES_ACCESS_TOKEN_WILDCARD } from "@/utils/accountAPIUtil";
import { RepeatIcon } from "@chakra-ui/icons";
import {
    Flex,
    Box,
    Text,
    Divider,
    Heading,
    IconButton,
    Button,
    Link,
} from "@chakra-ui/react";
import axios from "axios";
import { Dispatch, SetStateAction, useState } from "react";
import Cookies from "js-cookie";
import { THEME_COLOR_DARK_ONYX } from "../../../../constants/constants";
import { poppinsBold } from "../../../../utils/themeUtil";
import { getQueueApiUrl } from "../../../../utils/environmentUtilWCA";

interface PositionsInQueueProps {
    numberAheadOfMe: number;
    setNumberAheadOfMe: Dispatch<SetStateAction<number>>;
    placeInLine: number;
    setPlaceInLine: Dispatch<SetStateAction<number>>;
    totalInLine: number;
    setTotalInLine: Dispatch<SetStateAction<number>>;
    setShowEnterEvent: Dispatch<SetStateAction<boolean>>;
    handleRefresh: () => Promise<void>;
    isRefreshLoading: boolean;
    stageId: string;
}

const PositionsInQueue = ({
    numberAheadOfMe,
    setNumberAheadOfMe,
    placeInLine,
    totalInLine,
    setPlaceInLine,
    setTotalInLine,
    setShowEnterEvent,
    handleRefresh,
    isRefreshLoading,
    stageId,
}: PositionsInQueueProps) => {
    const [isJoinQueueLoading, setIsJoinQueueLoading] =
        useState<boolean>(false);

    const joinQueue = async () => {
        try {
            setIsJoinQueueLoading(true);
            const wildcardAccessToken = Cookies.get(
                COOKIES_ACCESS_TOKEN_WILDCARD
            );
            const joinQueueApiUrl = getQueueApiUrl() + "/join";
            const joinQueueResponse = await axios.post(
                joinQueueApiUrl,
                { QueueId: stageId },
                {
                    headers: {
                        Authorization: `Bearer ${wildcardAccessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const joinQueue = joinQueueResponse.data;

            if (joinQueue.LetUserInNow || (joinQueue.PlaceInLine > -1 && joinQueue.NumberAheadOfMe < 1)) {
                setShowEnterEvent(true);
            }

            setNumberAheadOfMe(
                joinQueue.NumberAheadOfMe === -1 ? 0 : joinQueue.NumberAheadOfMe
            );
            setPlaceInLine(joinQueue.PlaceInLine);
            setTotalInLine(joinQueue.TotalInLine);
            setIsJoinQueueLoading(false);
        } catch (e: any) {
            console.error("Error failed to join queue", e);
            setIsJoinQueueLoading(false);
            return;
        }
    };

    const renderPositionInQueuePaddedZerosValue = (placeInLine: number) => {
        const formattedNumberAheadOfMe = numberAheadOfMe?.toString();
        const totalMissingLeadingZeros = 4 - formattedNumberAheadOfMe.length;
        const paddedFormattedNumberAheadOfMe = formattedNumberAheadOfMe.padStart(4, "0");
        const formattedNumberAheadOfMeList = paddedFormattedNumberAheadOfMe.split("");
        let numMissingLeadingZeros = 0;

        return (
            <>
                {formattedNumberAheadOfMeList.map((digit, index) => {
                    let color = "white";
                    if (numMissingLeadingZeros < totalMissingLeadingZeros) {
                        color = THEME_COLOR_DARK_ONYX;
                        numMissingLeadingZeros += 1;
                    }

                    return (
                        <Flex flexDirection={"column"} key={index}>
                            <Text
                                key={`${paddedFormattedNumberAheadOfMe}-${index}`}
                                className={poppinsBold.className}
                                sx={{
                                    color: color,
                                    fontSize: "56px",
                                    textAlign: "center",
                                    lineHeight: "1.1"
                                }}
                            >
                                {digit}
                            </Text>
                        </Flex>
                    );
                })}
            </>
        )
    };

    const renderPositionInQueue = () => {
        if (placeInLine > -1) {
            return (
                <>
                    <>
                        <Text
                            sx={{
                                display: "inline-block",
                                fontSize: "xs",
                                color: "gray",
                            }}
                        >
                            Your Position in line
                        </Text>
                        <Flex>{renderPositionInQueuePaddedZerosValue(placeInLine)}</Flex>
                        <Text
                            sx={{
                                display: "inline-block",
                                fontSize: "xs",
                                color: "gray",
                            }}
                        >
                            There are {totalInLine} users in line
                        </Text>
                        <IconButton
                            mt={"25px"}
                            aria-label="refresh"
                            icon={<RepeatIcon />}
                            onClick={handleRefresh}
                            isLoading={isRefreshLoading}
                        />
                    </>
                </>
            );
        }

        return (
            <Button onClick={joinQueue} isLoading={isJoinQueueLoading}>
                Join Queue
            </Button>
        );
    };

    return (
        <Flex
            sx={{
                flex: "2 0 0",
                flexDirection: ["column", "column", "row", "row", "row"],
                alignItems: ["center", "center", "flex-start", "flex-start", "flex-start"],
            }}
        >
            <Flex
                sx={{
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    gap: 4,
                    width: ["26ch", "26ch", "auto", "auto", "auto"],
                    px: 4,
                }}
            >
                <Text
                    sx={{
                        fontSize: "3xl",
                        fontWeight: 600,
                    }}
                >
                    The event is full
                </Text>
                <Text
                    sx={{
                        color: "white",
                        fontWeight: 100,
                    }}
                >
                    Click on &quot;Join Queue&quot; to get in line.
                </Text>{" "}
                <Text
                    sx={{
                        color: "gray",
                        fontWeight: 100,
                        mb: "20px",
                    }}
                >   
                    {/*If you have a Wildpass in your connected wallet or a VIP link, you can skip the line.*/}
                    Migrated Wildpass holders skip the queue, so make sure to connect your wallet. Haven&apos;t migrated yet? <Link target={"_blank"} style={{ color: '#8888ff', textDecoration: 'underline' }} href={"https://migration.wildcardgame.com/"}>Click Here</Link> <br/><br/> <Link target={"_blank"} style={{ color: '#8888ff', textDecoration: 'underline' }} href={"https://magiceden.us/collections/ethereum/0xd8cb3f39875def5853b155c0adf2530644397428"}>What is a wildpass?</Link>
                </Text>
            </Flex>
            <Divider
                display={["none", "none", "block", "block"]}
                orientation={"vertical"}
                sx={{
                    height: "200px",
                    borderWidth: "1px",
                    borderColor: "white",
                }}
            />
            <Flex
                sx={{
                    px: 4,
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: 0,
                }}
            >
                {renderPositionInQueue()}
            </Flex>
        </Flex>
    );
};

export default PositionsInQueue;
