import { useChatAppIdleGameContext } from "@/contexts/chatAppIdleGameContext";
import { IdleEvent } from "@/types";
import { getIdleIcon } from "@/utils/streamUtils";
import { Box } from "@chakra-ui/react";

interface FanfareIconsProps {
    isPersonalEvent?: boolean;
}

const FanfareIcons = ({ isPersonalEvent }: FanfareIconsProps) => {
    const { personalEvents, fandomEvents } = useChatAppIdleGameContext();

    const renderIcon = (icon: string, key: string) => {
        return (
            <Box
                key={key}
                // w={"50px"}
                fontSize={"1.5rem"}
                alignSelf={"center"}
            >
                {icon}
            </Box>
        );
    };

    const renderPersonalEventIcons = () => {
        return personalEvents.map((event: IdleEvent, index: number) => {
            if (!event.isPersonalEvent) {
                return null;
            }

            const key = `${event.name}-${index}`;
            const icon = getIdleIcon(event);
            return renderIcon(icon, key);
        });
    };

    const renderFandomEventIcons = () => {
        return fandomEvents.map((event: IdleEvent, index: number) => {
            if (!event.isPersonalEvent) {
                const key = `${event.name}-${index}`;
                const icon = getIdleIcon(event);
                return renderIcon(icon, key);
            }

            return null;
        });
    };

    if (isPersonalEvent) {
        return renderPersonalEventIcons();
    }

    return renderFandomEventIcons();
};

export default FanfareIcons;
