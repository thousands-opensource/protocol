import StageTable from "@/features/StageTable";
import OrganizerDashboardMenu from "@/features/OrganizerDashboardMenu";
import { Box, Button, Card, Flex, Text } from "@chakra-ui/react";
import { GetServerSideProps } from "next";
import React from "react";
import router from "next/router";
import { IoMdCreate } from "react-icons/io";
import { AuthorizedUserData } from "@/utils/backend/sessionServerUtil";
import EventLayout from "@/layouts/EventLayout";
import { UserRole } from "@repo/interfaces";
import { WILDFILE_ROUTES } from "@/constants/routes";
import { checkUserAuthorizedForPage } from "@/utils/profileUtil";
import { formatRouteConfigUrl } from "../../../utils/routeUtil";

interface DashboardProps {
    serverCode: string;
}

function Dashboard({ serverCode }: DashboardProps) {
    const userRole: UserRole = UserRole.ADMIN;

    // User must have a role of developer or admin
    const renderCreateEventButtonJSX = (serverCode: string) => {
        const formattedCreateEventRouteUrl = formatRouteConfigUrl(
            WILDFILE_ROUTES.SERVER.EVENT_DASHBOARD.EVENT.CREATE.url,
            { serverCode }
        );

        if (userRole === UserRole.ADMIN || userRole === UserRole.DEVELOPER) {
            return (
                <Button
                    variant={"outline"}
                    border="solid 1px gray"
                    bg="glassDark.bg"
                    leftIcon={<IoMdCreate color="white" />}
                    onClick={() => {
                        router.push(formattedCreateEventRouteUrl);
                    }}
                >
                    <Text color="white">Create Event</Text>
                </Button>
            );
        }
    };

    

    return (
        <EventLayout>
            <Flex flexDirection={"column"} gap="10px" width="70%" pt={"1rem"}>
                <Flex flexDirection="row" justify="space-between">
                    <OrganizerDashboardMenu serverCode={serverCode} />
                    <Box justifyContent="flex-end">
                        {renderCreateEventButtonJSX(serverCode)}
                    </Box>
                </Flex>

                <div style={{ position: "relative" }}>
                    <Card border="1px gray solid" style={{ padding: "20px" }}>
                        <StageTable userRole={userRole} />
                    </Card>
                </div>
            </Flex>
        </EventLayout>
    );
}

export default Dashboard;

export const getServerSideProps: GetServerSideProps = async (context) => {
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

    const serverCode = authorizedUserData.serverDoc?.serverCode;

    return {
        props: {
            serverCode,
        },
    };
};
