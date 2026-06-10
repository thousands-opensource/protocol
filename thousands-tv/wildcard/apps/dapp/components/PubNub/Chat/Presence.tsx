import { useUserMetaContext } from "@/contexts/userMetaContext";
import { getUserProfilePicture } from "@/utils/chatUtil";
import { Avatar, Tooltip } from "@material-tailwind/react";

interface PubNubChatPresenceProps {
    presence: string[];
}

const PubNubChatPresence = ({ presence }: PubNubChatPresenceProps) => {
    const { users } = useUserMetaContext();

    return (
        <div className="w-full flex gap-2.5 items-center mb-4 overflow-x-auto pl-5">
            {presence.map((user) => (
                <Tooltip key={user}>
                    <Tooltip.Trigger>
                        <Avatar
                            className="h-12 w-12"
                            src={getUserProfilePicture(users, user)}
                            alt="profile-picture"
                        />
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                        <Tooltip.Arrow />
                    </Tooltip.Content>
                </Tooltip>
            ))}
        </div>
    );
};

export default PubNubChatPresence;
