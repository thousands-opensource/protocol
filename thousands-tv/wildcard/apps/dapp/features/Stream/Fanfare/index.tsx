import {
    Box,
    CloseButton,
    Flex,
    Grid,
    GridItem,
    Heading,
    Text,
} from "@chakra-ui/react";
import ConsumableActionRow from "./ConsumableActionRow";
import FanfareCard from "./FanfareCard";
import FanfareIcons from "./FanfareIcons";
import { Dispatch, SetStateAction, cloneElement, useState } from "react";
import { getUserDisplayName } from "@/utils/streamUtils";
import { IBadge } from "@repo/interfaces";
import BadgeCard from "@/features/Wildfile/WildFileProfile/Badge/BadgeCard";
import CollectibleList from "../Body/CollectibleStore/CollectibleList";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { useStreamContext } from "@/contexts/streamContext";

interface FanfareProps {
    personalCredit: number;
    fandomCredit: number;
    badges: IBadge[];
    setOpenStore: Dispatch<SetStateAction<boolean>>;
}

const Fanfare = ({
    personalCredit,
    fandomCredit,
    badges,
    setOpenStore,
}: FanfareProps) => {
    const { userDB } = useWildfileUserContext();
    const userId = userDB?._id?.toString() ?? "";
    const displayName = getUserDisplayName(userDB);

    return (
        <Flex
            sx={{
                flexDirection: "column",
                w: "100%",
                gap: 2,
                flexGrow: 1,
            }}
        >
            <FanfareCard
                isPersonal={false}
                text={"Channel Name"}
                credit={fandomCredit}
                badges={[]}
                setOpenStore={setOpenStore}
            >
                <FanfareIcons />
            </FanfareCard>
            <FanfareCard
                isPersonal={true}
                text={displayName}
                credit={personalCredit}
                badges={badges}
                setOpenStore={setOpenStore}
            >
                <FanfareIcons isPersonalEvent={true} />
            </FanfareCard>
            <ConsumableActionRow
                personalCredit={personalCredit}
                userId={userId}
                userName={displayName}
            />
        </Flex>
    );
};

export default Fanfare;
