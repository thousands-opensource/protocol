import ChatAppIdleGameBidButtonProvider from "@/contexts/chatAppIdleGameBidButtonContext";
import ChatAppIdleGameProvider from "@/contexts/chatAppIdleGameContext";
import { useStreamContext } from "@/contexts/streamContext";
import { ChatApp } from "@repo/interfaces";

interface ChatAppProps {
    children?: React.ReactNode | React.ReactNode[];
}

const ChatApps: React.FC<ChatAppProps> = ({ children }) => {
    const { chatApp } = useStreamContext();
    if (chatApp === ChatApp.STREMECOIN) {
        return <>{children}</>;
    }

    return (
        <ChatAppIdleGameProvider>
            <ChatAppIdleGameBidButtonProvider>
                {children}
            </ChatAppIdleGameBidButtonProvider>
        </ChatAppIdleGameProvider>
    );
};

export default ChatApps;
