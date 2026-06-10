import { Button } from "@material-tailwind/react";

interface PubNubChatReplyMessageProps {
    replyingToUser: string | null;
    currentMessage: string | undefined;
    setReplyingTo: (show: boolean) => void;
}

/**
 * PubNubChatReplyMessage - Component to display a reply message in the chat
 */
const PubNubChatReplyMessage = ({
    replyingToUser,
    currentMessage,
    setReplyingTo,
}: PubNubChatReplyMessageProps) => {
    return (
        <div className="absolute -top-8 left-0 right-0 mx-2 rounded-t-lg flex justify-between items-center bg-black/100 border border-primary-600/30 px-3 py-1.5 shadow-md">
            <Button
                className="w-5 h-5 min-w-[1.25rem] mr-2 flex items-center justify-center text-xs p-0 text-primary-500 border border-primary-300 rounded-full hover:bg-primary-900/40"
                variant="ghost"
                onClick={() => setReplyingTo(false)}
            >
                x
            </Button>
            <div className="flex-1 flex items-center">
                <span className="text-xs text-primary-300">
                    Replying to{" "}
                    <b className="text-primary-800">{replyingToUser}</b>
                </span>
                <span className="text-xs truncate max-w-28 max-w-44 text-primary-500 ml-1">
                    {currentMessage}
                </span>
            </div>
        </div>
    );
};

export default PubNubChatReplyMessage;
