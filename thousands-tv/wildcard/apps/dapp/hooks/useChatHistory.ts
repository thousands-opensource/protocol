import { Channel, Message, ThreadChannel, ThreadMessage } from "@pubnub/chat";
import { useEffect, useMemo, useState } from "react";

const useChatHistory = () => {
    const [history, setHistory] = useState<Message[] | ThreadMessage[]>([]);
    const [loadMore, setLoadMore] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const MESSAGE_LIMIT = 150;

    const memoizedHistory = useMemo(() => history, [history]);

    const loadMoreMessages = async (activeChannel: Channel | ThreadChannel) => {
        // @todo revisit because history.length never existed before, recently added
        if (!activeChannel || !loadMore || history.length === 0) return;
        console.log(
            "what is my active channel",
            activeChannel,
            loadMore,
            history
        );
        const msgs = await activeChannel.getHistory({
            startTimetoken: history[0].timetoken,
        });
        setLoadMore(msgs.isMore);
        setHistory((prev) => [...msgs.messages, ...prev]);
        setLoadingHistory(true);
    };

    const deleteMessage = (timetoken: string) => {
        setHistory((prev) =>
            prev.filter((message) => message.timetoken !== timetoken)
        );
    };

    useEffect(() => {
        if (history.length > MESSAGE_LIMIT && !loadingHistory) {
            setHistory((prev) => prev.slice(-MESSAGE_LIMIT));
        }
    }, [history, loadingHistory]);

    const resetHistory = () => {
        setLoadingHistory(false);
        setLoadMore(true);
    };

    return {
        history: memoizedHistory,
        setHistory,
        loadMore,
        setLoadMore,
        loadMoreMessages,
        deleteMessage,
        resetHistory,
    };
};

export default useChatHistory;
