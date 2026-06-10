import { useRef, useState, useEffect, useMemo } from "react";
import { useSkyboxStore } from "@/store/useSkyboxStore";
import { Message } from "@pubnub/chat";
import usePubnubStore from "@/store/usePubnubStore";

interface SkyboxChatProps {
    chatHistory: Message[];
    renderMessages: (messages: Message[]) => JSX.Element[];
}
const SkyboxChat = ({ chatHistory, renderMessages }: SkyboxChatProps) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const { showSettings } = useSkyboxStore();
    const { activeChannel } = usePubnubStore();

    const skyboxChatHistory = useMemo(() => {
        return chatHistory.filter((chat) => {
            return chat.channelId === activeChannel?.id;
        });
    }, [activeChannel?.id, chatHistory]);

    // Auto-scroll to bottom when new messages are added
    useEffect(() => {
        if (messagesEndRef.current) {
            console.log("Found messagesEndRef");
            messagesEndRef.current.scrollIntoView({
                behavior: "instant",
                block: "end",
            });
        }
    }, [skyboxChatHistory]);
    // useEffect(() => {
    //     if (messagesEndRef.current) {
    //         messagesEndRef.current.scrollIntoView({
    //             behavior: "instant",
    //             block: "end",
    //         });
    //     }
    // }, [chatHistory]);
    // Handle sending a new message
    // const handleSendMessage = () => {
    //     if (newMessage.trim() === "") return;

    //     const newMsg = {
    //         id: messages.length + 1,
    //         username: "You",
    //         timestamp: new Date().toLocaleTimeString([], {
    //             hour: "2-digit",
    //             minute: "2-digit",
    //         }),
    //         message: newMessage,
    //         avatar: "/api/placeholder/48/48",
    //     };

    //     setMessages([...messages, newMsg]);
    //     setNewMessage("");
    // };

    if (showSettings) {
        return null;
    }

    return (
        <div id="skybox-chat" className="flex flex-col">
            <div className="flex-grow">
                {/* Chat message container with scroll */}
                <div
                    ref={chatContainerRef}
                    className="flex-grow overflow-y-auto "
                    style={{
                        scrollbarWidth: "thin",
                        scrollbarColor: "#444 #1A1A1A",
                    }}
                >
                    {/* {messages.map((msg) => (
                            <SkyboxChatMessage
                                key={msg.id}
                                username={msg.username}
                                timestamp={msg.timestamp}
                                message={msg.message}
                                avatar={msg.avatar}
                                teamColor={teamColor}
                            />
                        ))} */}
                    {renderMessages(skyboxChatHistory)}
                    <div ref={messagesEndRef} />
                </div>
            </div>
        </div>
    );
};

export default SkyboxChat;
