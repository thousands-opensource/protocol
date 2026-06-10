import { GetServerSideProps } from "next";
import React, { ReactElement, ReactNode, useEffect, useRef, useState } from "react";
import ReactSpeedometer from "react-d3-speedometer";
import PubNub, { SignalEvent } from "pubnub";
import { PubNubProvider } from "pubnub-react";
import {
    getPubnubPublishKey,
    getPubnubSubscribeKey,
} from "@/utils/environmentUtilWCA";
import { Chat, MessageEnvelope } from "@pubnub/react-chat-components";
import { ChatEvent } from "amazon-ivs-chat-messaging";

interface TextOptionWithVoteCount {
    TextOption: string;
    VoteCount: number;
}

interface PollOverlayProps {
    meterId: string;
}

interface SignalToStreamOverlay {
    VoteQuestionText: string;
    OptionAText: string;
    OptionBText: string;
    OptionAVoteCount: number;
    OptionBVoteCount: number;
    TotalVoteCount: number;
    FinalText: string;
    TextOptions: string[];
    TextOptionsWithVoteCount: TextOptionWithVoteCount[];
    LastWager: TextOptionWithVoteCount;
}

interface CountUpProps {
    initialValue: number,
    targetValue: number
}

type Visibility = "collapse" | "hidden" | "visible"; 

const CountUp = (countUpProps: CountUpProps) => {
    const { initialValue, targetValue } = countUpProps;
    const [value, setValue] = useState(initialValue);
    const duration = 2000;

    useEffect(() => {
        let startValue = initialValue;
        const interval = Math.floor(duration / (targetValue - initialValue));

        const counter = setInterval(() => {
            setValue(startValue);
            if (startValue >= targetValue) {
                clearInterval(counter);
            }
            startValue += 1;
        }, interval);

        return () => {
            clearInterval(counter);
        };
    }, [targetValue, initialValue])

    return (
        <p style={{ fontSize: "32px" }} >{value}</p>
    );
};

function PollOverlay({
    meterId,
}: PollOverlayProps) {

    const [overlayIsActive, setOverlayIsActive] = useState<boolean>(false);
    const [voteCount, setVoteCount] = useState<number>(0);
    const [previousVoteCount, setPreviousVoteCount] = useState<number>(0);
    const [showOverlay, setShowOverlay] = useState<Visibility | undefined>("hidden");
    const [showResult, setShowResult] = useState<boolean>(false);
    const [resultText, setResultText] = useState<string>("");
    const [backgroundColor, setBackgroundColor] = useState<string>("black");
    const [textOptions, setTextOptions] = useState<string[]>([]);
    const [textOptionsWithVoteCounts, setTextOptionsWithVoteCounts] = useState<TextOptionWithVoteCount[]>([]);
    const [voteQuestionText, setVoteQuestionText] = useState<string>("");
    const [lastWager, setLastWager] = useState<TextOptionWithVoteCount | null>(null);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [pubnub, setPubnub] = useState<PubNub>(() => {
        const _pubnub = new PubNub({
            publishKey: getPubnubPublishKey(),
            subscribeKey: getPubnubSubscribeKey(),
            userId: "producer-overlay-meter",
        });

        return _pubnub;
    });

    const renderTextOptions = () => {
        if (textOptions == null) {
            return (null);
        }

        return textOptions.map((row: any, index: number) => {
            return (
                <div key={index}>
                    <p>{row}</p>
                </div>
            );
        });
    };

    const renderTextOptionsWithVoteCounts = () => {
        if (textOptionsWithVoteCounts == null) {
            return (null);
        }

        var sortedTextOptionsWithVoteCounts = textOptionsWithVoteCounts.sort((a, b) => b.VoteCount - a.VoteCount);

        console.log("sortedTextOptionsWithVoteCounts: ", sortedTextOptionsWithVoteCounts);

        return sortedTextOptionsWithVoteCounts.map((row: any, index: number) => {
            if (index == 0) {
                return (
                    <div key={index}>
                        <p style={{ fontSize: "20px", color: "gold" }}>{row.TextOption}: {row.VoteCount}</p>
                    </div>
                );
            } else {
                return (
                    <div key={index}>
                        <p>{row.TextOption}: {row.VoteCount}</p>
                    </div>
                );
            }
        });
    };

    const renderLastWager = () => {
        if (lastWager == null) {
            return (null);
        }

        return (
            <div style={{ marginTop: "30px", fontSize: "16px" }}>
                <p>{lastWager.TextOption} wagered {lastWager.VoteCount} credits</p>
            </div>
        );
    };

    const onMessageHandler = (messageEnvelope: MessageEnvelope) => {
        console.log("onMessageHandler: ", messageEnvelope);

        var signalToStreamOverlay: SignalToStreamOverlay = messageEnvelope.message as unknown as SignalToStreamOverlay;
        console.log("signalToStreamOverlay: ", signalToStreamOverlay);

        if (overlayIsActive) {
            const totalVoteCount = signalToStreamOverlay.TotalVoteCount;
            const finalText = signalToStreamOverlay.FinalText;
            setPreviousVoteCount(voteCount);
            if (totalVoteCount > 0) {
                setVoteCount(totalVoteCount);
            } else {
                setVoteCount(0);
            }
            setLastWager(signalToStreamOverlay.LastWager);

            //This is the last signal.  Change to the result screen.
            if (finalText != "") {
                //if (intervalRef.current != null) {
                //    clearInterval(intervalRef.current);
                //}
                console.log("TextOptionsWithVoteCounts: ", signalToStreamOverlay.TextOptionsWithVoteCount);

                setResultText(finalText);
                setTextOptionsWithVoteCounts(signalToStreamOverlay.TextOptionsWithVoteCount);
                setShowResult(true);                

                setTimeout(() => {
                    setLastWager(null);
                    setOverlayIsActive(false);
                    setShowOverlay("hidden");
                    setResultText("");
                    setVoteCount(0);
                    setBackgroundColor("#000");
                }, 15000);
            }
        } else { //First execution
            setLastWager(null);
            setPreviousVoteCount(0);
            setShowResult(false);
            setResultText("");
            setVoteQuestionText(signalToStreamOverlay.VoteQuestionText);
            setVoteCount(0);
            setTextOptions(signalToStreamOverlay.TextOptions);
            setBackgroundColor("#333");
            setOverlayIsActive(true);
            setShowOverlay("visible");
        }
    };

    return (
        <PubNubProvider client={pubnub}>
            <div style={{ backgroundColor: backgroundColor, width: "400px", height: "250px" }}>
                <div style={{ visibility: showOverlay }}>

                    <div style={{ display: !showResult ? "block" : "none", width: "400px", height: "250px", textAlign: "center" }}>
                        <div style={{ paddingTop: "35px" }}>
                            <p style={{ color: "white", fontSize: "24px" }}>{voteQuestionText}</p>
                            {renderLastWager()}
                            <div style={{ marginTop: "25px" }}>
                                <p style={{ fontSize: "20px" }}>Votes</p>
                                <CountUp initialValue={previousVoteCount} targetValue={voteCount}></CountUp>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: showResult ? "block" : "none", textAlign: "center" }}>
                        <div style={{ paddingTop: "35px" }}>
                            <p style={{ color: "white", fontSize: "24px" }}>{resultText}</p>
                        </div>
                        <div style={{ marginTop: "25px" }}>
                            {renderTextOptionsWithVoteCounts()}
                        </div>
                    </div>

                </div>
            </div>
            <Chat
                currentChannel={"stream-overlay"}
                onMessage={onMessageHandler}
            >
            </Chat>
        </PubNubProvider>
    );
};

export default PollOverlay;

export const getServerSideProps: GetServerSideProps = async (context) => {


    return {
        props: {
            meterId: "1",
        },
    };
};