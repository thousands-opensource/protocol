import { Avatar } from "@material-tailwind/react";
import { getUserDisplayName, getUserProfilePicture } from "@/utils/chatUtil";
import { useUserMetaContext } from "@/contexts/userMetaContext";
import { ChatApp } from "@repo/interfaces";

interface PubNubChatPresenceTabProps {
    presence: string[];
    presenceClassName: string;
}

const PubNubChatPresenceTab = ({
    presence,
    presenceClassName,
}: PubNubChatPresenceTabProps) => {
    const { users } = useUserMetaContext();

    return (
        <div className="h-full flex items-center flex-col">
            <div
                className={`w-full flex flex-col items-start gap-2.5 overflow-y-auto pl-5 ${presenceClassName}`}
            >
                {presence.map((user) => (
                    <div key={user} className="flex items-center">
                        <Avatar
                            className="w-[38px] h-[38px]"
                            src={getUserProfilePicture(users, user)}
                            alt="profile-picture"
                        />
                        <span className="text-primary-500 text-sm ml-3">
                            {getUserDisplayName(users, user)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PubNubChatPresenceTab;
