import { Center, Flex, Text } from "@chakra-ui/react";
import ChatAction from "../../ChatAction";
import RawChatActionBody from "../../ChatAction/RawChatActionBody";
import { useStreamContext } from "@/contexts/streamContext";
import { poppinsMedium } from "@/utils/themeUtil";
import { THEME_COLOR_CLOUD_GREY } from "@/constants/constants";

const LiveActions = () => {
    const { liveChatActions, setSelectedChatAction } = useStreamContext();

    const renderLiveActions = () => {
        if (liveChatActions.length === 0) {
            return (
                <Center w={"100%"}>
                    <Text
                        className={poppinsMedium.className}
                        color={THEME_COLOR_CLOUD_GREY}
                    >
                        No live actions available
                    </Text>
                </Center>
            );
        }

        return liveChatActions.map((pca: any, index: number) => {
            return (
                <ChatAction chatAction={pca} key={index} isLiveAction={true}>
                    <RawChatActionBody
                        chatAction={pca}
                        setSelectedChatAction={setSelectedChatAction}
                    />
                </ChatAction>
            );
        });
    };

    return (
        <Flex
            id={"live-actions"}
            rowGap={4}
            px={1}
            py={8}
            pb={0}
            flexDirection={"column"}
        >
            <Flex rowGap={2} flexDirection={"column"}>
                <Text>Live Actions</Text>
                <Flex
                    flexDirection={"row"}
                    flexWrap={"wrap"}
                    gap={1}
                    rowGap={2}
                >
                    {renderLiveActions()}
                </Flex>
            </Flex>
        </Flex>
    );
};
export default LiveActions;
