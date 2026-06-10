import { Box, Button, Card, Flex, Text } from "@chakra-ui/react";
import React from "react";
import router from "next/router";
import { IoMdCreate } from "react-icons/io";
import { WILDFILE_ROUTES } from "@/constants/routes";
import { formatRouteConfigUrl } from "@/utils/routeUtil";

interface OrganizerDashboardMenuProps {
    serverCode: string;
}

function OrganizerDashboardMenu({ serverCode }: OrganizerDashboardMenuProps) {
    const renderEventsButtonJSX = (serverCode: string) => {
        const formattedEventsRouteUrl = formatRouteConfigUrl(
            WILDFILE_ROUTES.SERVER.EVENT_DASHBOARD.BASE.url,
            { serverCode }
        );

        return (
            <Button
                variant={"outline"}
                border="solid 1px gray"
                bg="glassDark.bg"
                mr={2}
                leftIcon={<IoMdCreate color="white" />}
                onClick={() => {
                    router.push(formattedEventsRouteUrl);
                }}
            >
                <Text color="white">Events</Text>
            </Button>
        );
    };

    const renderSeriesButtonJSX = (serverCode: string) => {
        const formattedSeriesRouteUrl = formatRouteConfigUrl(
            WILDFILE_ROUTES.SERVER.SERIES_DASHBOARD.BASE.url,
            { serverCode }
        );

        return (
            <Button
                variant={"outline"}
                border="solid 1px gray"
                bg="glassDark.bg"
                mr={2}
                leftIcon={<IoMdCreate color="white" />}
                onClick={() => {
                    router.push(formattedSeriesRouteUrl);
                }}
            >
                <Text color="white">Series</Text>
            </Button>
        );
    };

    const renderIdentitiesButtonJSX = (serverCode: string) => {
        const formattedIdentitiesRouteUrl = formatRouteConfigUrl(
            WILDFILE_ROUTES.SERVER.IDENTITY_DASHBOARD.BASE.url,
            { serverCode }
        );

        return (
            <Button
                variant={"outline"}
                border="solid 1px gray"
                bg="glassDark.bg"
                mr={2}
                leftIcon={<IoMdCreate color="white" />}
                onClick={() => {
                    router.push(formattedIdentitiesRouteUrl);
                }}
            >
                <Text color="white">Identities</Text>
            </Button>
        );
    };

    const renderCreditAdjustmentsButtonJSX = (serverCode: string) => {
        const formattedCreditAdjustmentsRouteUrl = formatRouteConfigUrl(
            WILDFILE_ROUTES.SERVER.USERS.CREDITADJUSTMENTS.BASE.url,
            { serverCode }
        );

        return (
            <Button
                variant="outline"
                border="solid 1px gray"
                bg="glassDark.bg"
                mr={2}
                leftIcon={<IoMdCreate color="white" />}
                onClick={() => {
                    router.push(formattedCreditAdjustmentsRouteUrl);
                }}
            >
                <Text color="white">Credit Adjustments</Text>
            </Button>
        );
    };

    const renderExternalStreamsButtonJSX = (serverCode: string) => {
        const formattedExternalStreamsRouteUrl = formatRouteConfigUrl(
            WILDFILE_ROUTES.SERVER.EXTERNAL_STREAMS.BASE.url,
            { serverCode }
        );

        return (
            <Button
                variant="outline"
                border="solid 1px gray"
                bg="glassDark.bg"
                mr={2}
                leftIcon={<IoMdCreate color="white" />}
                onClick={() => {
                    router.push(formattedExternalStreamsRouteUrl);
                }}
            >
                <Text color="white">External Streams</Text>
            </Button>
        );
    };

    const renderFranchisesButtonJSX = (serverCode: string) => {
        const formattedFranchisesRouteUrl = formatRouteConfigUrl(
            WILDFILE_ROUTES.SERVER.EVENT_DASHBOARD.FRANCHISES.url,
            { serverCode }
        );

        return (
            <Button
                variant="outline"
                border="solid 1px gray"
                bg="glassDark.bg"
                mr={2}
                leftIcon={<IoMdCreate color="white" />}
                onClick={() => {
                    router.push(formattedFranchisesRouteUrl);
                }}
            >
                <Text color="white">Franchises</Text>
            </Button>
        );
    };

    const renderRallyPredictionSettlementButtonJSX = (serverCode: string) => {
        const formattedRallyPredictionSettlementRouteUrl = formatRouteConfigUrl(
            WILDFILE_ROUTES.SERVER.RALLY_PREDICTION_SETTLEMENT.BASE.url,
            { serverCode }
        );

        return (
            <Button
                variant="outline"
                border="solid 1px gray"
                bg="glassDark.bg"
                mr={2}
                leftIcon={<IoMdCreate color="white" />}
                onClick={() => {
                    router.push(formattedRallyPredictionSettlementRouteUrl);
                }}
            >
                <Text color="white">Rally Settlement</Text>
            </Button>
        );
    };

    const renderRallyPredictionsButtonJSX = (serverCode: string) => {
        const formattedRallyPredictionsRouteUrl = formatRouteConfigUrl(
            WILDFILE_ROUTES.SERVER.MANAGE_PREDICTIONS_DASHBOARD.BASE.url,
            { serverCode }
        );

        return (
            <Button
                variant="outline"
                border="solid 1px gray"
                bg="glassDark.bg"
                mr={2}
                leftIcon={<IoMdCreate color="white" />}
                onClick={() => {
                    router.push(formattedRallyPredictionsRouteUrl);
                }}
            >
                <Text color="white">Forecasts</Text>
            </Button>
        );
    };

    const renderTournamentsButtonJSX = (serverCode: string) => {
        const formattedTournamentsRouteUrl = formatRouteConfigUrl(
            WILDFILE_ROUTES.SERVER.MANAGE_TOURNAMENTS_DASHBOARD.BASE.url,
            { serverCode }
        );

        return (
            <Button
                variant="outline"
                border="solid 1px gray"
                bg="glassDark.bg"
                mr={2}
                leftIcon={<IoMdCreate color="white" />}
                onClick={() => {
                    router.push(formattedTournamentsRouteUrl);
                }}
            >
                <Text color="white">Tournaments</Text>
            </Button>
        );
    };

    return (
        <Box>
            {renderEventsButtonJSX(serverCode)}
            {renderSeriesButtonJSX(serverCode)}
            {renderIdentitiesButtonJSX(serverCode)}
            {renderCreditAdjustmentsButtonJSX(serverCode)}
            {renderExternalStreamsButtonJSX(serverCode)}
            {renderFranchisesButtonJSX(serverCode)}
            {renderRallyPredictionSettlementButtonJSX(serverCode)}
            {renderRallyPredictionsButtonJSX(serverCode)}
            {renderTournamentsButtonJSX(serverCode)}
        </Box>
    );
}

export default OrganizerDashboardMenu;
