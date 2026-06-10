import { Box, Button, Card, Flex, Text } from "@chakra-ui/react";
import { GetServerSideProps } from "next";
import React from "react";
import router from "next/router";
import { IoMdCreate } from "react-icons/io";
import { AuthorizedUserData } from "@/utils/backend/sessionServerUtil";
import EventLayout from "@/layouts/EventLayout";
import { WILDFILE_ROUTES } from "@/constants/routes";
import { checkUserAuthorizedForPage } from "@/utils/profileUtil";
import { formatRouteConfigUrl } from "@/utils/routeUtil";
import RallyPredictionTable from "@/features/RallyPredictionTable";
import OrganizerDashboardMenu from "@/features/OrganizerDashboardMenu";

interface DashboardProps {
    serverCode: string;
}

function ManagePredictions({ serverCode }: DashboardProps) {
    
    const renderCreateRallyPredictionButtonJSX = (serverCode: string) => {
        const formattedCreateRallyPredictionRouteUrl = formatRouteConfigUrl(
            WILDFILE_ROUTES.SERVER.MANAGE_PREDICTIONS_DASHBOARD.PREDICTIONS.CREATE.url,
            { serverCode }
        );

        return (
            <Button
                variant={"outline"}
                border="solid 1px gray"
                bg="glassDark.bg"
                leftIcon={<IoMdCreate color="white" />}
                onClick={() => {
                    router.push(formattedCreateRallyPredictionRouteUrl);
                }}
            >
                <Text color="white">Create Forecast</Text>
            </Button>
        );
    };

    return (
        <EventLayout>
            <Flex flexDirection={"column"} gap="10px" width="70%" pt={"1rem"}>
                <Flex flexDirection="row" justify="space-between">
                    <OrganizerDashboardMenu serverCode={serverCode} />
                    <Box justifyContent="flex-end">
                        {renderCreateRallyPredictionButtonJSX(serverCode)}
                    </Box>
                </Flex>

                <div style={{ position: "relative" }}>
                    <Card border="1px gray solid" style={{ padding: "20px" }}>
                        <RallyPredictionTable />
                    </Card>
                </div>
            </Flex>
        </EventLayout>
    );
}

export default ManagePredictions;

export const getServerSideProps: GetServerSideProps = async (context) => {

    const userAuthorizedForPageResult = await checkUserAuthorizedForPage(
        context
    );

    if (!userAuthorizedForPageResult.success) {
        return userAuthorizedForPageResult.data as {
            redirect: { destination: string; permanent: boolean };
        };
    }

    const authorizedUserData: AuthorizedUserData =
        userAuthorizedForPageResult.data as AuthorizedUserData;

        const serverCode = authorizedUserData.serverDoc?.serverCode;

    return {
        props: {
            serverCode,
        },
    };
};
