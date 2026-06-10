import PledgeCard from "@/components/PledgeCard";
import StremeCoinCard from "@/components/StremeCoinCard";
import { MarketOrder } from "@/features/Stream";
import { Button } from "@material-tailwind/react";
import Image from "next/image";
import { Dispatch, SetStateAction } from "react";

interface PubNubActionTemplateProps {
    actionTemplate: ActionTemplate;
    onHandleSelectAction?: (actionTemplate: ActionTemplate) => void;
    chatMessage?: boolean;
    setStremeCoin: Dispatch<SetStateAction<string>>;
    setMarketOrderEntry: Dispatch<SetStateAction<MarketOrder>>;
}

export interface ActionTemplate {
    actionLabel: string;
    text: string;
    command: string;
    type: string;
    src: string;
    chatActionGuid: string;
}
const PubNubActionTemplate = ({
    actionTemplate,
    chatMessage,
    onHandleSelectAction,
    setStremeCoin,
    setMarketOrderEntry,
}: PubNubActionTemplateProps) => {
    const { actionLabel, text, command, type, src, chatActionGuid } =
        actionTemplate;

    const handleSelectAction = async (actionTemplate: ActionTemplate) => {
        const { type, text, actionLabel } = actionTemplate;
        if (type === "streme-coin") {
            setMarketOrderEntry(MarketOrder.BUY);
            setStremeCoin(text);
        }
    };

    if (type === "streme-coin") {
        return (
            <StremeCoinCard
                stremeCoin={text}
                actionLabel={actionLabel}
                setStremeCoin={setStremeCoin}
                setMarketOrderEntry={setMarketOrderEntry}
            />
        );
    }

    if (type === "pledge") {
        return <PledgeCard actionTemplate={actionTemplate} />;
    }

    return (
        <Button
            className={`p-0 ${!chatMessage && "mx-4 my-3"} justify-start w-fit`}
            variant="ghost"
            onClick={() =>
                onHandleSelectAction &&
                onHandleSelectAction({
                    actionLabel,
                    text,
                    command,
                    type,
                    src,
                    chatActionGuid,
                })
            }
        >
            <Image
                objectFit="fit"
                height="56"
                width="60"
                src={src}
                alt={command}
                className="rounded-s-xl"
            />

            <div className="bg-white flex flex-col p-2.5 rounded-e-xl items-start">
                <span className="text-primary-400 font-medium text-sm">
                    {actionLabel}
                </span>
                <span className="text-primary-400 text-xs">{text}</span>
            </div>
        </Button>
    );
};
export default PubNubActionTemplate;
