import { GetServerSideProps } from "next";
import React, { useEffect, useRef, useState } from "react";
import ReactSpeedometer, { CustomSegmentLabelPosition } from "react-d3-speedometer";
import PubNub, { SignalEvent } from "pubnub";
import { PubNubProvider } from "pubnub-react";
import {
    getPubnubPublishKey,
    getPubnubSecretKey,
    getPubnubSubscribeKey,
} from "@/utils/environmentUtilWCA";
import { Chat, MessageEnvelope } from "@pubnub/react-chat-components";

interface SignalToStreamOverlay {
    RefereeCallText: string;
}

type Visibility = "collapse" | "hidden" | "visible";

function RefereeCall() {

    const [controlIsActive, setControlIsActive] = useState<boolean>(false);
    const [showControl, setShowControl] = useState<Visibility | undefined>("hidden");
    const [resultText, setResultText] = useState<string>("");
    const [backgroundColor, setBackgroundColor] = useState<string>("black");

    const [pubnub, setPubnub] = useState<PubNub>(() => {
        const _pubnub = new PubNub({
            publishKey: getPubnubPublishKey(),
            subscribeKey: getPubnubSubscribeKey(),
            secretKey: "sec-c-NmVhNTE1NmYtYzU3OC00YzRhLTkzODQtMGFlZDMyYWQyNzJm",
            userId: "producer-overlay-meter",
        });

        return _pubnub;
    });

    const onMessageHandler = (messageEnvelope: MessageEnvelope) => {
        console.log("onMessageHandler: ", messageEnvelope);

        var signalToStreamOverlay: SignalToStreamOverlay = messageEnvelope.message as unknown as SignalToStreamOverlay;
        console.log("signalToStreamOverlay: ", signalToStreamOverlay);

        if (!controlIsActive) {
            setResultText("The referee noticed you, check your wallet in a few hours!");
            setControlIsActive(true);
            setShowControl("visible");
            setBackgroundColor("#333");

            setTimeout(() => {
                setResultText("");
                setControlIsActive(false);
                setShowControl("hidden");
                setResultText("");
                setBackgroundColor("#000");
            }, 60000);
        }
    };

    return (
        <PubNubProvider client={pubnub}>
            <div style={{ backgroundColor: backgroundColor }}>
                <div style={{ display: showControl, width: "800px", height: "600px", textAlign: "center" }}>
                    <div style={{ padding: "50px" }}>
                        <p style={{ color: "white", fontSize: "16px" }} dangerouslySetInnerHTML={{ __html: resultText }}></p>
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


}

export default RefereeCall;

export const getServerSideProps: GetServerSideProps = async (context) => {


    return {
        props: {
            meterId: "1",
        },
    };
};