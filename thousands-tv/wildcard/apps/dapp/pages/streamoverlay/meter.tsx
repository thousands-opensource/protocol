import { GetServerSideProps } from "next";
import React, { useEffect, useRef, useState } from "react";
import ReactSpeedometer, { CustomSegmentLabelPosition } from "react-d3-speedometer";
import PubNub, { SignalEvent } from "pubnub";
import { PubNubProvider } from "pubnub-react";
import {
    getPubnubPublishKey,
    getPubnubSubscribeKey,
} from "@/utils/environmentUtilWCA";
import { Chat, MessageEnvelope } from "@pubnub/react-chat-components";
import { ChatEvent } from "amazon-ivs-chat-messaging";

interface MeterProps {
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
}

type Visibility = "collapse" | "hidden" | "visible"; 

function Meter({
    meterId,
}: MeterProps) {

    const [meterIsActive, setMeterIsActive] = useState<boolean>(false);
    const [voteCount, setVoteCount] = useState<number>(0);
    const [meterValue, setMeterValue] = useState<number>(0.5);
    const [showMeter, setShowMeter] = useState<Visibility | undefined>("hidden");
    const [showResult, setShowResult] = useState<string>("none");    
    const [resultText, setResultText] = useState<string>("");
    const [backgroundColor, setBackgroundColor] = useState<string>("black");
    const [optionAText, setOptionAText] = useState<string>("");
    const [optionBText, setOptionBText] = useState<string>("");
    const [voteQuestionText, setVoteQuestionText] = useState<string>("");

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const calculateRandomMeterBounce = (value: number) => {
        let outValue = (Math.random() * 0.1) + value - 0.05;
        outValue = Math.min(Math.max(outValue, 0), 1);
        console.log("newMeterValue: ", outValue);
        return outValue;
    };

    useEffect(() => {
        if (!meterIsActive) {
            if (intervalRef.current != null) {
                clearInterval(intervalRef.current);
            }
            return;
        }

        let newMeterValue = calculateRandomMeterBounce(voteCount);
        setMeterValue(newMeterValue);
        if (intervalRef.current != null) {
            clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(() => {
            let newMeterValue = calculateRandomMeterBounce(voteCount);
            console.log("meterValue: ", meterValue);
            console.log("newMeterValue: ", newMeterValue);
            setMeterValue(newMeterValue)
        }, 500);
    }, [voteCount, meterIsActive]);

    const [pubnub, setPubnub] = useState<PubNub>(() => {
        const _pubnub = new PubNub({
            publishKey: getPubnubPublishKey(),
            subscribeKey: getPubnubSubscribeKey(),
            userId: "producer-overlay-meter",
        });

        return _pubnub;
    });

    const onMessageHandler = (messageEnvelope: MessageEnvelope) => {
        console.log("onMessageHandler: ", messageEnvelope);

        var signalToStreamOverlay: SignalToStreamOverlay = messageEnvelope.message as unknown as SignalToStreamOverlay;
        console.log("signalToStreamOverlay: ", signalToStreamOverlay);

        if (meterIsActive) {
            const optionAVoteCount = signalToStreamOverlay.OptionAVoteCount;
            const totalVoteCount = signalToStreamOverlay.TotalVoteCount;
            const finalText = signalToStreamOverlay.FinalText;
            if (totalVoteCount > 0) {
                setVoteCount((totalVoteCount - optionAVoteCount) / totalVoteCount);
            } else {
                setVoteCount(0.5);
            }

            //This is the last signal.  Change to the result screen.
            if (finalText != "") {
                if (intervalRef.current != null) {
                    clearInterval(intervalRef.current);
                }
                setShowMeter("hidden");
                setMeterValue(0);
                setMeterIsActive(false);

                setShowResult("block")
                setResultText(finalText);

                setTimeout(() => {
                    setResultText("");
                    setBackgroundColor("#000");
                }, 10000);
            }
        } else { //First execution
            setShowResult("none")
            setResultText("");

            setMeterIsActive(true);
            setShowMeter("visible");
            setBackgroundColor("#333");

            setVoteQuestionText(signalToStreamOverlay.VoteQuestionText);
            setOptionAText("Option A");
            setOptionBText("Option B");
            setVoteCount(0.5);

        }
    };

    return (
        <PubNubProvider client={pubnub}>
            <div style={{ backgroundColor: backgroundColor }}>
                <div style={{ display: showResult, width: "400px", height: "250px", textAlign: "center" }}>
                    <div style={{ paddingTop: "110px" }}>
                        <p style={{ color: "white", fontSize: "24px" }}>{resultText}</p>
                    </div>
                </div>
                <div style={{ visibility: showMeter }}>
                    <ReactSpeedometer
                        width={400}
                        height={300}
                        value={meterValue}
                        segments={2}
                        minValue={0}
                        maxValue={1}
                        segmentColors={[
                            "#a876f2",
                            "#5ec500",
                        ]}
                        currentValueText={voteQuestionText}
                        textColor={"#fff"}
                        customSegmentLabels={
                            [
                                {
                                    text: "Eric",
                                    position: CustomSegmentLabelPosition.Inside,
                                    color: "#333",
                                },
                                {
                                    text: "Eb",
                                    position: CustomSegmentLabelPosition.Inside,
                                    color: "#333",
                                }
                            ]
                        }
                    />
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

export default Meter;

export const getServerSideProps: GetServerSideProps = async (context) => {


    return {
        props: {
            meterId: "1",
        },
    };
};