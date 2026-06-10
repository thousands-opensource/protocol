import { Flex, Box, Text, Button, useToast, Icon } from "@chakra-ui/react";
import React, { useEffect } from "react";
import { GetServerSideProps } from "next";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import {
    authorizeUser,
    AuthorizedUserData,
} from "@/utils/backend/sessionServerUtil";
import { THEME_COLOR_BG_PRIMARY, THEME_COLOR_SECONDARY } from "@/constants";
import { mapErrorToMessage } from "@/utils/accountsUtil";
import router from "next/router";
import { MdError } from "react-icons/md";

interface UnauthorizedProps {
    userDB: any;
    connectedUserDBProviderId: any;
    connectedUserDBEmail: any;
    accessRules: string[];
}

const UnauthorizedUser: React.FC<UnauthorizedProps> = ({}) => {
    const {
        userDB,
        setUserDB,
        setConnectedUserDBProviderId,
        setConnectedUserDBEmail,
    } = useWildfileUserContext();

    const toast = useToast();

    // Display toast message based on the error query parameter
    useEffect(() => {
        const error = router.query.error;
        if (error) {
            toast({
                title: "Error",
                description: mapErrorToMessage(error),
                status: "error",
                duration: 9000,
                isClosable: true,
                position: "top",
            });
        }
    }, [router]);

    return (
        <Flex
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            p="20px"
            bg={THEME_COLOR_BG_PRIMARY}
            h="100vh"
            textAlign="center"
        >
            <Box mb="8">
                <Icon
                    as={MdError}
                    boxSize="100"
                    color="THEME_COLOR_BG_PRIMARY"
                />{" "}
            </Box>
            <Text fontSize="4xl" fontWeight="bold" color={"white"}>
                {`Oops, look like you're not authorized to access this page`}
            </Text>
            <Text fontSize="xl" mt="4" color="gray.500">
                You do not have the necessary roles to access this page. Contact
                community admin for more information.
            </Text>
            <Button
                bg="glass.bg"
                border="1px solid"
                borderColor={THEME_COLOR_SECONDARY}
                mt="6"
                size="lg"
                onClick={() => router.push("/")}
            >
                Go to Homepage
            </Button>
        </Flex>
    );
};

export default UnauthorizedUser;

// check if user is authenticated and has a valid token if not return back to login page
// signed in OAuth user requires to get an access token to fully login to WC apis
export const getServerSideProps: GetServerSideProps = async (context) => {
    const authorizedUserData: AuthorizedUserData | null = await authorizeUser(
        context
    );

    if (!authorizedUserData) {
        console.log("User not found. Redirecting to login page");
        return {
            redirect: {
                destination: "/login",
                permanent: false,
            },
        };
    }

    try {
        return {
            props: {},
        };
    } catch (e) {
        console.log("Failed to get beamable account", e);
        return {
            props: {},
        };
    }
};
