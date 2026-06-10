import { useUserMetaContext } from "@/contexts/userMetaContext";
import { getUserDisplayName } from "@/utils/chatUtil";
import { Button } from "@material-tailwind/react";
import { Message } from "@pubnub/chat";

import Image from "next/image";

interface PubNubQuoteProps {
    quote: Message;
    setTimetoken: (timetoken: string) => void;
}
const PubNubQuote = ({ quote, setTimetoken }: PubNubQuoteProps) => {
    const { users } = useUserMetaContext();
    return (
        <Button
            variant="ghost"
            className="flex items-center justify-start gap-1.5 px-0 py-0 pb-1.5"
            onClick={() => setTimetoken(quote.timetoken)}
        >
            <Image
                src={"/images/PubNub/reply-message.svg"}
                alt={"reply"}
                width={20}
                height={20}
            />
            <span className="font-bold text-xs text-primary-500">
                {getUserDisplayName(users, quote.userId)}
            </span>
            <span className="font-medium text-xs text-primary-500 truncate max-w-[70%]">
                {quote.text}
            </span>
        </Button>
    );
};
export default PubNubQuote;
