import { useStreamContext } from "@/contexts/streamContext";
import { Flex, CloseButton } from "@chakra-ui/react";
import ChatAction from "../../ChatAction";
import FinalizedChatActionBody from "../../ChatAction/FinalizedChatActionBody";

const SelectedAction = () => {
    const { selectedChatAction, setSelectedChatAction } = useStreamContext();

    if (!selectedChatAction) {
        return null;
    }

    return (
        <Flex
            id={"selected-chat-actions"}
            rowGap={4}
            flexDirection={"column"}
            sx={{
                border: `2px solid #343435`,
                borderBottom: "transparent",
                borderRadius: "12px",
                borderBottomLeftRadius: "none",
                borderBottomRightRadius: "none",
                height: "100px",
                p: 4,
                position: "relative",
                mb: "0px",
                backgroundColor: "#1E1E1E",
            }}
        >
            <Flex flexDirection={"row"}>
                <ChatAction chatAction={selectedChatAction}>
                    <FinalizedChatActionBody chatAction={selectedChatAction} />
                </ChatAction>
            </Flex>
            <CloseButton
                sx={{
                    position: "absolute",
                    top: 1,
                    right: 0,
                }}
                onClick={() => setSelectedChatAction(null)}
            />
        </Flex>
    );
};
export default SelectedAction;
