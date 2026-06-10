import { ChannelEntity, ChannelList } from "@pubnub/react-chat-components";
import PubnubChannel from "./PubnubChannel";
import { useStreamContext } from "@/contexts/streamContext";

interface PubnubChannelListProps {}

const PubnubChannelList = ({}: PubnubChannelListProps) => {
    const { channels } = useStreamContext();
    return (
        <ChannelList
            channels={channels}
            channelRenderer={(channel: ChannelEntity) => {
                return <PubnubChannel key={channel.id} channel={channel} />;
            }}
        />
    );
};
export default PubnubChannelList;
