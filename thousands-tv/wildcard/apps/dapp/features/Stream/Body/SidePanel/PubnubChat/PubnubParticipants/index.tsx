import {
    Menu,
    MenuButton,
    IconButton,
    MenuList,
    MenuItem,
    useToast,
} from "@chakra-ui/react";
import { useStreamContext } from "@/contexts/streamContext";
import {
    MemberList,
    UserEntity,
    UserEntityWithMembership,
} from "@pubnub/react-chat-components";
import axios from "axios";
import { FaEllipsisVertical, FaPeopleLine } from "react-icons/fa6";

interface PubnubParticipantsProps {
    channelOccupants: { uuid: string; state?: any }[];
    members: UserEntityWithMembership[];
    canInviteUpOnStage: boolean;
    streamId?: string;
}

const PubnubParticipants = ({
    channelOccupants,
    members,
    canInviteUpOnStage,
    streamId,
}: PubnubParticipantsProps) => {
    const presentMembers = channelOccupants?.map((o) => o.uuid);
    const toast = useToast();

    const renderMenuList = (member: UserEntity) => {
        const { id, name } = member;
        return (
            <Menu>
                <MenuButton
                    as={IconButton}
                    aria-label="More Options"
                    icon={<FaEllipsisVertical />}
                    sx={{ border: "none" }}
                    variant="outline"
                />
                <MenuList
                    sx={{
                        bgColor: "#1e232a",
                        "& > button": {
                            bgColor: "#1e232a",
                            _hover: {
                                opacity: 0.5,
                            },
                        },
                    }}
                >
                    {renderParticipantMenuItems(id)}
                </MenuList>
            </Menu>
        );
    };

    const renderParticipantMenuItems = (name: string) => {
        return (
            <MenuItem
                isDisabled={!canInviteUpOnStage}
                icon={<FaPeopleLine />}
                onClick={(e) => inviteUpOnStageClickHandler(e, name)}
            >
                Invite to Stage
            </MenuItem>
        );
    };

    const inviteUpOnStage = async (userName: string) => {
        try {
            const invitePayload = {
                streamId,
                userName,
            };
            const response = await axios.post(
                "/api/events/inviteUpOnStage",
                invitePayload
            );
            console.log(response.data);

            if (!response.data) {
                const msg = "Error inviting user on stage";
                toast({
                    description: msg,
                    status: "error",
                    duration: 5000,
                    position: "top",
                });
                return;
            }
        } catch (e: any) {
            const msg = `Error inviting user on stage: ${e.message}`;
            console.error(msg);
            toast({
                description: msg,
                status: "error",
                duration: 5000,
                position: "top",
            });
        }
    };

    const inviteUpOnStageClickHandler = (
        e: React.MouseEvent<HTMLButtonElement>,
        userName: string
    ) => {
        if (!streamId) {
            toast({
                description: "Error invalid streamId.",
                status: "error",
                duration: 5000,
                position: "top",
            });
            return;
        }

        inviteUpOnStage(userName);
    };

    return (
        <MemberList
            members={members}
            presentMembers={presentMembers}
            extraActionsRenderer={renderMenuList}
        />
    );
};

export default PubnubParticipants;
