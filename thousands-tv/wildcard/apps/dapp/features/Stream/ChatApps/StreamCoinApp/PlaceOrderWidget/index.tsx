import { useChatAppStreamCoinsBuySellContext } from "@/contexts/chatAppStreamCoinsBuySellContext";
import { useConfirmationContext } from "@/contexts/confirmationContext";
import { useStreamContext } from "@/contexts/streamContext";
import PlaceOrderPopup from "@/features/Stream/PlaceOrderPopup";
import { Flex } from "@chakra-ui/react";
import { Message } from "@pubnub/chat";
import { ChatApp } from "@repo/interfaces";

interface StreamCoinPlaceOrderWidgetProps {
    onSendMessage: (
        message: string,
        quote?: Message | null,
        metadata?: {
            [objKey: string]: any;
        }
    ) => void;
}
const StreamCoinPlaceOrderWidget = ({
    onSendMessage,
}: StreamCoinPlaceOrderWidgetProps) => {
    const { chatApp } = useStreamContext();
    const { openPopup } = useConfirmationContext();
    const {
        orderEntry,
        marketOrderEntry,
        orderEntryQuantity,
        handleConfirmStremeCoin,
    } = useChatAppStreamCoinsBuySellContext();

    if (chatApp !== ChatApp.STREMECOIN) {
        return null;
    }

    if (!openPopup) {
        return null;
    }

    return (
        <Flex
            sx={{
                alignItems: "center",
                w: "100%",
                mb: 1,
            }}
        >
            <PlaceOrderPopup
                handleConfirm={async () => {
                    await handleConfirmStremeCoin();
                    const metadata = {
                        actionTemplate: {
                            actionLabel: `${marketOrderEntry}:${orderEntryQuantity}`,
                            text: orderEntry,
                            type: "streme-coin",
                            src: "",
                            command: "",
                            chatActionGuid: "",
                        },
                    };
                    onSendMessage("", null, metadata);
                }}
            />
        </Flex>
    );
};
export default StreamCoinPlaceOrderWidget;
