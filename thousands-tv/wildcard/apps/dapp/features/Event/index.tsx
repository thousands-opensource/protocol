import React, {
    memo,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { Box, Button, Flex, useToast } from "@chakra-ui/react";
import {
    getAllowedThemeColorObjectByColorName,
    alabasterColorObj,
} from "@/utils/wildpassUtil";
import { IRecognitionProgram, IStage, IUser } from "@repo/interfaces";
import { useRouter } from "next/router";
import Link from "next/link";
import { mapErrorToMessage } from "@/utils/accountsUtil";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { ColorObject, SeriesToEvents, TextEvent } from "@/types";
import ProfileContext from "../Wildfile/WildfileContext";
import EventsSeries from "./EventsSeries";
import ThousandsLayout from "@/layouts/ThousandsLayout";
import { getWildcardTokens } from "@/utils/backend/alchemyUtil";
import { useBalancesStore as useBalanceStore } from "@/store/useWalletStore";
import { getWildpassTokensContractAddress } from "@/utils/environmentUtil";
import { IdentityDoc } from "@repo/schemas";
import { SponsoredEventRow } from "@/components/sponsoredEvents";
import { FranchiseEntry } from "@/components/franchiseIndexLeaderboard";

interface EventProps {
    userDB: IUser;
    connectedUserDBProviderId: string;
    connectedUserDBEmail: string | null;
    stages: IStage[];
    selectedEvent: string | null;
    seriesToEvents: SeriesToEvents[];
    formattedRecognitionProgram?: any;
    formattedRecognitionProgramTabs: IRecognitionProgram[];
    serverCode: string;
    serverId: string;
    serverName: string;
    sponsoredEvents: SponsoredEventRow[];
    franchiseLeaderboard: FranchiseEntry[];
    identities: IdentityDoc[];
    showFranchisesAndSponsorships: boolean;
}

// Thousands Account Profile Page
const Event = ({
    userDB,
    connectedUserDBProviderId,
    connectedUserDBEmail,
    stages,
    selectedEvent,
    seriesToEvents,
    formattedRecognitionProgram,
    formattedRecognitionProgramTabs,
    serverCode,
    serverId,
    serverName,
    sponsoredEvents,
    franchiseLeaderboard,
    identities,
    showFranchisesAndSponsorships,
}: EventProps) => {
    const toast = useToast();
    const router = useRouter();
    const updateBalance = useBalanceStore((state) => state.updateBalance);
    const { tab } = router.query;

    const { setUserDB, setConnectedUserDBProviderId, setConnectedUserDBEmail } =
        useWildfileUserContext();

    const updateUserContext = useCallback(() => {
        setUserDB(userDB);
        setConnectedUserDBProviderId(connectedUserDBProviderId);
        if (connectedUserDBEmail) {
            setConnectedUserDBEmail(connectedUserDBEmail);
        }
    }, [userDB]);

    const address = useMemo(() => userDB?.walletProvider?.address, [userDB]);
    const hasFetchedTokens = useRef(false);

    useEffect(() => {
        updateUserContext();
    }, [updateUserContext]);

    // Display toast message based on the error query parameter
    useEffect(() => {
        const errorMsg = router.query.error;
        if (errorMsg) {
            toast({
                title: "Something went wrong:",
                description: mapErrorToMessage(errorMsg),
                status: "error",
                duration: 9000,
                isClosable: true,
                position: "top",
            });
        }
    }, [router]);

    const { pageOwnerUser } = useContext(ProfileContext);

    // get color object
    const themeColorObj = getAllowedThemeColorObjectByColorName(
        pageOwnerUser?.preferences?.avatarThemeColor || alabasterColorObj
    );

    const [avatarThemeColor, setAvatarThemeColor] =
        useState<ColorObject>(themeColorObj);

    const updateAvatarThemeColor = useCallback(() => {
        if (!pageOwnerUser) {
            return;
        }
        const avatarThemeColorObj = getAllowedThemeColorObjectByColorName(
            pageOwnerUser?.preferences?.avatarThemeColor
        );

        if (!avatarThemeColorObj) {
            return;
        }

        setAvatarThemeColor(avatarThemeColorObj);
    }, [pageOwnerUser]);

    useEffect(() => {
        updateAvatarThemeColor();
    }, [updateAvatarThemeColor]);

    useEffect(() => {
        if (!hasFetchedTokens.current && userDB?.walletProvider?.address && tab === "profile") {
            hasFetchedTokens.current = true;
            getWildcardTokens(userDB.walletProvider.address)
                .then((res) => {
                    // @ts-ignore
                    updateBalance(getWildpassTokensContractAddress(), (res?.[0]?.tokenBalance));
                })
                .catch((error) => {
                    toast({
                        title: "Error",
                        description: "Failed to fetch wildcard tokens count",
                        status: "error",
                        duration: 5000,
                        isClosable: true,
                    });
                    // Optionally reset the flag if you want to allow retrying:
                    hasFetchedTokens.current = false;
                });
        }
    }, [address, tab])

    const thousandsXp = userDB?.thousandsXp ?? 0;

    return (
        <ThousandsLayout
            userDB={userDB}
            connectedUserDBEmail={connectedUserDBEmail}
            connectedUserDBProviderId={connectedUserDBProviderId}
        >
            {showFranchisesAndSponsorships && (
                <Flex
                    justify="flex-start"
                    gap={4}
                    px={{ base: 4, md: 10 }}
                    pt={{ base: 6, md: 8 }}
                    pb={{ base: 2, md: 4 }}
                >
                    <Button
                        as={Link}
                        href={`/${serverCode}/franchises`}
                        size="lg"
                        color="white"
                        bg="rgba(255,255,255,0.18)"
                        border="1px solid rgba(255,255,255,0.35)"
                        borderRadius="full"
                        _hover={{
                            bg: "rgba(255,255,255,0.28)",
                            transform: "translateY(-2px)",
                        }}
                    >
                        Franchises
                    </Button>
                    <Button
                        as={Link}
                        href={`/${serverCode}/sponsorevents`}
                        size="lg"
                        color="white"
                        bg="rgba(255,255,255,0.18)"
                        border="1px solid rgba(255,255,255,0.35)"
                        borderRadius="full"
                        _hover={{
                            bg: "rgba(255,255,255,0.28)",
                            transform: "translateY(-2px)",
                        }}
                    >
                        Sponsorships
                    </Button>
                </Flex>
            )}
            <EventsSeries
                stages={stages}
                initialSelectedEvent={
                    selectedEvent ? JSON.parse(selectedEvent) : null
                }
                identities={identities}
                seriesToEvents={seriesToEvents}
                formattedRecognitionProgram={formattedRecognitionProgram}
                formattedRecognitionProgramTabs={
                    formattedRecognitionProgramTabs
                }
                serverCode={serverCode}
                serverId={serverId}
                serverName={serverName}
                sponsoredEvents={sponsoredEvents}
                franchiseLeaderboard={franchiseLeaderboard}
                currentUserId={userDB?._id?.toString()}
                userThousandsXp={thousandsXp}
            />
        </ThousandsLayout>
    );
};
export default memo(Event);
