import React from 'react';
import { Box, Container, Text, VStack, Flex, Divider } from '@chakra-ui/react';
import { GetServerSideProps } from 'next';
import EventLayout from '@/layouts/EventLayout';
import { RallyPredictionCsvExport } from '@/components/RallyPredictionCsvExport';
import RallyCalculatorTest from '@/components/RallyCalculatorTest';
import { checkUserAuthorizedForPage } from '@/utils/profileUtil';
import { AuthorizedUserData } from '@/utils/backend/sessionServerUtil';
import OrganizerDashboardMenu from '@/features/OrganizerDashboardMenu';

interface RallyPredictionSettlementPageProps {
    serverCode: string;
}

export const RallyPredictionSettlementPage: React.FC<RallyPredictionSettlementPageProps> = ({
    serverCode,
}) => {
    return (
        <EventLayout>
            <Flex flexDirection={"column"} gap="10px" width="70%" pt={"1rem"}>
                <Flex flexDirection="row" justify="space-between">
                    <Text fontSize="32px" fontWeight="bold" color="white">
                        Rally Prediction Settlement
                    </Text>
                </Flex>
                <OrganizerDashboardMenu serverCode={serverCode} />

                <Container maxW="6xl" py={8}>
                    <VStack spacing={8} align="stretch">
                        <RallyPredictionCsvExport />

                        <Divider />

                        <Box>
                            <Text fontSize="24px" fontWeight="bold" color="white" mb={4}>
                                Rally Calculator Test
                            </Text>
                        </Box>

                        <RallyCalculatorTest />
                    </VStack>
                </Container>
            </Flex>
        </EventLayout>
    );
};

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

export default RallyPredictionSettlementPage;
