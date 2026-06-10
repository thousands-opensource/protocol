import { toastDefaultOptions } from "@/constants/constants";
import { getBeamableAccountByUserDB } from "@/utils/accountsUtil";
import { getUserDisplayName } from "@/utils/streamUtils";
import {
    Box,
    useToast,
    Button,
    Flex,
    AbsoluteCenter,
    Image,
    Text,
} from "@chakra-ui/react";
import { IUser, UserRole, WildcardApiResponse, EventCreationPayload } from "@repo/interfaces";
import axios from "axios";

interface PublicEventProps {
    eventId: string;
    beamableEventMetadata: EventCreationPayload;
    user: IUser;
    error?: string;
}

const PublicEvent = ({
    eventId,
    beamableEventMetadata,
    user,
    error,
}: PublicEventProps) => {
    const toast = useToast();

    const handleCompete = async () => {
        try {
            const beamableAccount = getBeamableAccountByUserDB(user);
            if (!beamableAccount) {
                const msg = "User does not have beamable account";
                console.log(msg);
                toast({
                    ...toastDefaultOptions,
                    description: msg,
                    status: "error",
                    duration: 5000,
                    position: "top",
                });
                return;
            }

            if (!user.roles.includes(UserRole.COMPETITOR)) {
                const msg = "User does not have Competitor role";
                console.log(msg);
                toast({
                    ...toastDefaultOptions,
                    description: msg,
                    status: "error",
                    duration: 5000,
                    position: "top",
                });
                return;
            }

            const { data }: { data: WildcardApiResponse } = await axios.put(
                `/api/beamable/event-players/score?objectId=${beamableAccount.id}`,
                {
                    vendorEventId: eventId,
                    score: 1,
                    userId: user?._id!.toString(),
                }
            );

            if (!data.success) {
                console.log(data.err);
                toast({
                    ...toastDefaultOptions,
                    description: data.err,
                    status: "error",
                    duration: 5000,
                    position: "top",
                });
                return;
            }

            const msg = `Successfully registered competitor ${getUserDisplayName(
                user
            )} to event match: ${beamableEventMetadata.content.name}`;
            toast({
                ...toastDefaultOptions,
                description: msg,
                status: "success",
                duration: 5000,
                position: "top",
            });
        } catch (e) {
            const errMsg = "Failed to register competitor";
            console.error(errMsg, error);
            toast({
                ...toastDefaultOptions,
                description: errMsg,
                status: "error",
                duration: 5000,
                position: "top",
            });
        }
    };

    const phase = beamableEventMetadata.content.phases[0];

    return (
        <Flex
            color="black"
            minH={"100%"}
            width={"100%"}
            sx={{
                flexDirection: "column",
                color: "white",
            }}
        >
            <Box position="relative" padding="10" marginTop="50">
                <AbsoluteCenter px="4">
                    <Text fontSize={"6xl"} as="b">
                        {beamableEventMetadata.content.name}
                    </Text>
                </AbsoluteCenter>
            </Box>
            <Flex
                minH={"100%"}
                width={"100%"}
                flexGrow={1}
                sx={{
                    flexDirection: "row",
                }}
            >
                {/* 
                <Flex
                    minH={"100%"}
                    width={"100%"}
                    sx={{
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                    }}
                >
                    <Image
                        src={"/images/Locke_FullSize_Image.png"}
                        alt={"Watch"}
                        h="400px"
                        style={{ marginBottom: "50px" }}
                        transition="transform 0.3s"
                        _groupHover={{ transform: "scale(1.05)" }}
                    />
                    {renderWatchBtnJsx()}
                </Flex>
                <Divider orientation="vertical" />
                */}
                <Flex
                    minH={"100%"}
                    width={"100%"}
                    sx={{
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                    }}
                >
                    <Image
                        src={"/images/Bolgar_Action.png"}
                        alt={"Compete"}
                        h="400px"
                        style={{ marginBottom: "50px" }}
                        transition="transform 0.3s"
                        _groupHover={{ transform: "scale(1.05)" }}
                    />

                    <Button onClick={handleCompete}>Compete</Button>
                </Flex>
            </Flex>
        </Flex>
    );
};
export default PublicEvent;
