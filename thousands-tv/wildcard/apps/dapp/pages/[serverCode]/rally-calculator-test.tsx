import React from 'react';
import { Box, Container, Text, VStack, Flex } from '@chakra-ui/react';
import { GetServerSideProps } from 'next';
import EventLayout from '@/layouts/EventLayout';
import RallyCalculatorTest from '@/components/RallyCalculatorTest';
import { checkUserAuthorizedForPage } from '@/utils/profileUtil';
import { AuthorizedUserData } from '@/utils/backend/sessionServerUtil';
import OrganizerDashboardMenu from '@/features/OrganizerDashboardMenu';

interface RallyCalculatorTestPageProps {
    serverCode: string;
}

export const RallyCalculatorTestPage: React.FC<RallyCalculatorTestPageProps> = ({
    serverCode,
}) => {
    return (
        <EventLayout>
            <Flex flexDirection={"column"} gap="10px" width="90%" pt={"1rem"}>
                <Flex flexDirection="row" justify="space-between">
                    <Text fontSize="32px" fontWeight="bold" color="white">
                        Rally Calculator Test
                    </Text>
                </Flex>
                <OrganizerDashboardMenu serverCode={serverCode} />

                <Container maxW="6xl" py={8}>
                    <VStack spacing={8} align="stretch">
                        <Box>
                            <Text color="gray.300" mb={6}>
                                Test component for calculating game theory metrics. Select a rally prediction
                                and input values to see the calculated timing factors, position multipliers,
                                and bonus scores in real-time.
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

export default RallyCalculatorTestPage;
