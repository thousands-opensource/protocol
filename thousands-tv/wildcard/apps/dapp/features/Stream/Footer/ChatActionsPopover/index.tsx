import { MutableRefObject } from "react";
import { AddIcon } from "@chakra-ui/icons";
import {
    Popover,
    PopoverTrigger,
    IconButton,
    PopoverContent,
    PopoverHeader,
    Divider,
    PopoverCloseButton,
    PopoverBody,
} from "@chakra-ui/react";
import { useStreamContext } from "@/contexts/streamContext";
import SelectedAction from "./SelectedAction";
import MyActions from "./MyActions";
import LiveActions from "./LiveActions";

interface ChatActionsPopoverProps {
    pubnubInputRef: MutableRefObject<HTMLDivElement | null>;
}

const ChatActionsPopover = ({ pubnubInputRef }: ChatActionsPopoverProps) => {
    const { setSelectedChatAction, openChatActions, setOpenChatActions } =
        useStreamContext();
    return (
        <Popover
            id={"my-chat-actions-popover"}
            placement="bottom"
            closeOnBlur={false}
            isOpen={openChatActions}
            onClose={() => setOpenChatActions(false)}
            offset={[0, 6]}
        >
            <PopoverTrigger>
                <IconButton
                    className={"special-actions"}
                    aria-label="actions"
                    icon={<AddIcon color={"#ED7E5F"} />}
                    size="sm"
                    minW={"20px"}
                    h={"20px"}
                    variant="ghost"
                    _hover={{
                        bg: "navy.600",
                    }}
                    onClick={() => {
                        setOpenChatActions(true);
                        setSelectedChatAction(null);
                    }}
                />
            </PopoverTrigger>
            <PopoverContent
                color="white"
                bg="#1E1E1Ef2"
                borderColor="transparent"
                borderTopLeftRadius={"48px"}
                borderTopRightRadius={"48px"}
                w={
                    pubnubInputRef.current
                        ? (pubnubInputRef.current.clientWidth as number)
                        : 400
                }
            >
                <PopoverHeader
                    px={3}
                    py={3}
                    fontWeight="bold"
                    border="0"
                    textAlign="center"
                >
                    Actions
                </PopoverHeader>
                <Divider sx={{ borderColor: "gray" }} />
                <PopoverCloseButton
                    sx={{
                        fontSize: "var(--chakra-fontSizes-sm)",
                        top: "var(--chakra-space-5)",
                    }}
                    onClick={() => {
                        setOpenChatActions(false);
                        setSelectedChatAction(null);
                    }}
                />
                <PopoverBody
                    display="flex"
                    flexDirection={"column"}
                    rowGap={8}
                    py={0}
                    px={2}
                >
                    {/* Not in V1 */}
                    {/* <LiveActions /> */}
                    <MyActions />
                    {/* <SelectedAction /> */}
                </PopoverBody>
            </PopoverContent>
        </Popover>
    );
};

export default ChatActionsPopover;
