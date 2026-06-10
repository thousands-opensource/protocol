import { poppinsBold } from "@/utils/themeUtil";
import { Flex, Text } from "@chakra-ui/react";
import ChatAction from "../../ChatAction";

const MyActions = () => {
    const mockChatAction = {
        chatActionGuid: "",
        actionLabel: "Cheer",
        text: "Make some noise",
        command: "cheer",
        type: "",
    };

    return (
        <Flex
            id={"my-chat-actions"}
            rowGap={4}
            px={1}
            mt={4}
            flexDirection={"column"}
            mb={"2rem"}
        >
            <Flex rowGap={2} flexDirection={"column"} h="100%">
                <Text className={poppinsBold.className}>My Actions</Text>
                <Flex
                    flexDirection={"row"}
                    flexWrap={"wrap"}
                    gap={1}
                    rowGap={2}
                >
                    <ChatAction chatAction={mockChatAction}>
                        {/* <RawChatActionBody
                            chatAction={mockChatAction}
                            setSelectedChatAction={setSelectedChatAction}
                        /> */}
                    </ChatAction>
                </Flex>
            </Flex>
        </Flex>
    );
};
export default MyActions;
