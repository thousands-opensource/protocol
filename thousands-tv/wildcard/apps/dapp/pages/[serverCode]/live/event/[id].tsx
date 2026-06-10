import connectToDb from "@/db/connectToDb";
import {
    findOneFreeTicketByQuery,
    findOneRippedTicketByQuery,
} from "@repo/schemas";
import PublicEvent from "@/features/PublicEvent";
import EventLayout from "@/layouts/EventLayout";
import { AuthorizedUserData } from "@/utils/backend/sessionServerUtil";
import { getAPIEndpointRootUrl } from "@/utils/environmentUtilWCA";
import { redirectUserIfUnauthorized } from "@/utils/sessionUtil";
import { Flex, Text } from "@chakra-ui/react";
import axios from "axios";
import { GetServerSideProps } from "next";
import { diContainer } from "@/inversify.config";
import IEventService from "@/services/interfaces/iEventService";
import { IUser } from "@repo/interfaces";
import { checkUserAuthorizedForPage } from "@/utils/profileUtil";

interface PublicEventPageProps {
    eventId: string;
    beamableEventMetadataStr: string;
    userStr: string;
    serverDocCode: string;
    error?: string;
}

const PublicEventPage = ({
    eventId,
    beamableEventMetadataStr,
    userStr,
    serverDocCode,
    error,
}: PublicEventPageProps) => {
    const userDB = JSON.parse(userStr);
    const beamableEventMetadata = JSON.parse(beamableEventMetadataStr);

    if (error) {
        return (
            <EventLayout>
                <Flex
                    minH={"100%"}
                    width={"100%"}
                    flexGrow={1}
                    sx={{
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <Text fontSize={"4xl"} casing={"initial"}>
                        {error}
                    </Text>
                </Flex>
            </EventLayout>
        );
    }

    return (
        <EventLayout>
            <PublicEvent
                eventId={eventId}
                beamableEventMetadata={beamableEventMetadata}
                user={userDB}
                error={error}
            />
        </EventLayout>
    );
};

export default PublicEventPage;

export const getServerSideProps: GetServerSideProps<
    | PublicEventPageProps
    | { redirect: { destination: string; permanent: boolean } }
> = async (context) => {
    const eventId = context.params?.id as string;
    const userAuthorizedForPageResult = await checkUserAuthorizedForPage(
        context
    );

    if (!userAuthorizedForPageResult.success) {
        // redirect the user if they are not authorized
        return userAuthorizedForPageResult.data as {
            redirect: { destination: string; permanent: boolean };
        };
    }

    const authorizedUserData: AuthorizedUserData =
        userAuthorizedForPageResult.data as AuthorizedUserData;
    const userDB: IUser | null = authorizedUserData?.userDB;

    const { wildcardAccessToken, serverDoc } = authorizedUserData;
    const serverDocCode = serverDoc?.serverCode || "";

    const redirect = redirectUserIfUnauthorized(
        wildcardAccessToken,
        userDB,
        context
    );

    if (redirect) {
        return redirect;
    }

    try {
        await connectToDb();

        //Get gamertag for user
        const gamerTag: string = userDB?.beamableProvider?.id || "";

        if (gamerTag === "") {
            const errMsg = "Failed to fetch game user id";
            console.error("Failed to fetch game user id");
            return {
                props: {
                    eventId: "",
                    beamableEventMetadataStr: "",
                    userStr: "",
                    hasBeenRipped: false,
                    hasBeenClaimed: false,
                    serverDocCode: serverDocCode,
                    error: errMsg,
                },
            };
        }

        const eventService: IEventService = diContainer.get("IEventService");

        //Set this user in Beamable as a competitor
        eventService.setUserAsCompetitor(gamerTag);

        if (!eventId) {
            const errMsg = "No event id found.";
            console.error(errMsg);
            return {
                props: {
                    eventId: "",
                    beamableEventMetadataStr: "",
                    userStr: JSON.stringify(userDB),
                    hasBeenRipped: false,
                    hasBeenClaimed: false,
                    serverDocCode: serverDocCode,
                    error: errMsg,
                },
            };
        }

        const beamableEventMetadataResponse = await axios.get(
            `${getAPIEndpointRootUrl()}/api/beamable/event/get?objectId=${eventId}`,
            {
                headers: {
                    Authorization: `Bearer ${wildcardAccessToken}`,
                },
            }
        );

        /*
        const existingRippedTicketPromise = findOneRippedTicketByQuery({
            userId: userDB!._id,
            eventId: eventId,
        });
        

        const existingTicketPromise = findOneFreeTicketByQuery({
            owner: userDB!._id,
        });

        const [
            beamableEventMetadataResponse,
            existingRippedTicket,
            existingTicket,
        ] = await Promise.all([
            beamableEventPromise,
            existingRippedTicketPromise,
            existingTicketPromise,
        ]);
        */

        const { data: beamableEventMetadata } = beamableEventMetadataResponse;
        if (!beamableEventMetadata) {
            const errMsg = "No event found.";
            console.error(errMsg);
            return {
                props: {
                    eventId,
                    beamableEventMetadataStr: "",
                    userStr: JSON.stringify(userDB),
                    hasBeenRipped: false,
                    hasBeenClaimed: false,
                    serverDocCode: serverDocCode,
                    error: errMsg,
                },
            };
        }

        return {
            props: {
                eventId,
                beamableEventMetadataStr: JSON.stringify(beamableEventMetadata),
                userStr: JSON.stringify(userDB),
                hasBeenRipped: false,
                hasBeenClaimed: false,
                serverDocCode: serverDocCode,
            },
        };
    } catch (e) {
        const errMsg = "Failed to fetch live event";
        console.error("Failed to fetch live event", e);
        return {
            props: {
                eventId: "",
                beamableEventMetadataStr: "",
                userStr: "",
                hasBeenRipped: false,
                hasBeenClaimed: false,
                serverDocCode: "",
                error: errMsg,
            },
        };
    }
};
