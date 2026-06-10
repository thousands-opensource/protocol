import {
    THEME_COLOR_DARK_GOLDEN_YELLOW,
    WILDCARD_ACTIONS,
} from "@/constants/constants";
import { Flex } from "@chakra-ui/react";
import ConsumableAction from "../ConsumableAction";
import { WildcardActionMetaData } from "@/types";
import { Dispatch, SetStateAction } from "react";

interface ConsumableActionRowProps {
    personalCredit: number;
    userId: string;
    userName: string;
}

const ConsumableActionRow = ({
    personalCredit,
    userId,
    userName,
}: ConsumableActionRowProps) => {
    return (
        <Flex
            borderRadius={"12px"}
            border={`2px solid ${THEME_COLOR_DARK_GOLDEN_YELLOW}`}
            alignItems={"center"}
            flexGrow={1}
        >
            {WILDCARD_ACTIONS.map(
                (metadata: WildcardActionMetaData, index: number) => {
                    return (
                        <ConsumableAction
                            metadata={metadata}
                            key={index}
                            personalCredit={personalCredit}
                            userId={userId}
                            userName={userName}
                        />
                    );
                }
            )}
        </Flex>
    );
};
export default ConsumableActionRow;
