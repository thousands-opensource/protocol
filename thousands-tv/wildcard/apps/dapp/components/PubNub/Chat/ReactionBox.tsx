import { Button, Tooltip } from "@material-tailwind/react";
import { useMemo, useRef, useState } from "react";
import { getUserDisplayName } from "@/utils/chatUtil";
import { useUserMetaContext } from "@/contexts/userMetaContext";
import { useGetUsersStore } from "@/store/useGetUsersStore";

interface PubNubChatReactionBoxProps {
    emoji: string;
    total: number;
    self: boolean;
    handleEmojiReaction: () => Promise<void>;
    names: {
        uuid: string;
        actionTimetoken: string | number;
    }[];
}

const PubNubChatReactionBox = ({
    emoji,
    total,
    self,
    names,
    handleEmojiReaction,
}: PubNubChatReactionBoxProps) => {
    const [isTooltipOpen, setIsTooltipOpen] = useState(false);
    const { users, pubnub, setUsers } = useUserMetaContext();
    const updateUsers = useGetUsersStore((state) => state.updateUsers);

    const getUnkonwnUsers = async () => {
        const ids = names.map((name) => name.uuid);
        await updateUsers(pubnub, ids);
    };

    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
    const pressStartTime = useRef<number | null>(null);
    const handleTouchStart = () => {
        pressStartTime.current = Date.now();
        setIsTooltipOpen(false);

        const id = setInterval(() => {
            const pressDuration =
                Date.now() - (pressStartTime.current ?? Date.now());
            if (pressDuration >= 1000 && !isTooltipOpen) {
                setIsTooltipOpen(true);
            }
        }, 50);

        setIntervalId(id);
    };

    const handleTouchEnd = () => {
        if (intervalId) {
            clearInterval(intervalId);
        }

        if (pressStartTime) {
            const pressDuration =
                Date.now() - (pressStartTime.current ?? Date.now());
            if (pressDuration < 1000) {
                handleEmojiReaction();
            }

            pressStartTime.current = null;
        }
        setIsTooltipOpen(false);
    };

    const handleTouchMove = () => {
        if (intervalId) {
            clearInterval(intervalId);
        }
        setIsTooltipOpen(false);
    };

    const handleMouseOver = () => {
        getUnkonwnUsers();
        setIsTooltipOpen(true);
    };
    const getNames = useMemo(() => {
        return names
            .map((name) => getUserDisplayName(users, name.uuid))
            .join(", ");
    }, [names, users]);

    return (
        <>
            {total > 0 && (
                <Tooltip open={isTooltipOpen} onOpenChange={setIsTooltipOpen}>
                    <Tooltip.Trigger
                        as={Button}
                        className={`p-0 rounded-xl border ${
                            self ? "border-secondary-100" : "border-primary-500"
                        } w-12 h-6 mt-0.5 mr-1.5`}
                        variant="ghost"
                        onClick={handleEmojiReaction}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchMove}
                        onMouseEnter={handleMouseOver}
                        onMouseLeave={() => setIsTooltipOpen(false)}
                    >
                        <span
                            className={`${
                                self ? "text-secondary-100" : "text-primary-500"
                            } text-xs pr-0.5`}
                        >
                            {total}
                        </span>
                        <span className="text-xs">{emoji}</span>
                    </Tooltip.Trigger>
                    <Tooltip.Content className="text-primary-500 truncate max-w-48">
                        {getNames}
                    </Tooltip.Content>
                </Tooltip>
            )}
        </>
    );
};

export default PubNubChatReactionBox;
