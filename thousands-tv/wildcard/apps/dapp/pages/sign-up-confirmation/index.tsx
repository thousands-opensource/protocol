import MainLayout from "@/layouts/MainLayout";
import { Flex, useToast } from "@chakra-ui/react";
import React, { useEffect } from "react";
import { GetServerSideProps } from "next";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { WILDFILE_ROUTES } from "@/constants/routes";
import router from "next/router";
import { mapErrorToMessage } from "@/utils/accountsUtil";
import {
    authorizeUser,
    AuthorizedUserData,
} from "@/utils/backend/sessionServerUtil";
import SignUpConfirmationSplash from "@/features/LoginOrSignUpFlow/_ui/SignUpConfirmationSplash";
import { checkUserNotAuthorizedForClosedEnvironment } from "@/utils/profileUtil";

interface SignUpConfirmationProps {
    accountData: any;
    userDetails: any;
    findUser: any;
    setFindUser: any;
}

function SignUpConfirmation({
    accountData: accountDataProps,
    userDetails: userDetailsProps,
    findUser: findUserProps,
}: SignUpConfirmationProps) {
    const { userDB, setUserDB } = useWildfileUserContext();
    const { setIsLoggedIn } = useWildfileUserContext();

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

    useEffect(() => {
        if (userDetailsProps || userDB) {
            setIsLoggedIn(true);
        } else {
            setIsLoggedIn(false);
        }
    }, [userDetailsProps]);

    return (
        <MainLayout>
            <Flex flexDirection="column" justifyContent="center" h="100%">
                <SignUpConfirmationSplash />
            </Flex>
        </MainLayout>
    );
}

export default SignUpConfirmation;

// check if user is authenticated and has a valid token if not return back to login page
// signed in OAuth user requires to get an access token to fully login to WC apis
export const getServerSideProps: GetServerSideProps = async (context) => {
    const authorizedUserData: AuthorizedUserData | null = await authorizeUser(
        context
    );

    if (!authorizedUserData) {
        const errMsg = `User not found in signup confirmation page.`;
        console.log(errMsg);
        return {
            props: {},
        };
    }

    if (!authorizedUserData.wildcardAccessToken) {
        return {
            props: {},
        };
    }

    // if user has only spectator role and the environment is closed, pass through to the page
    if (checkUserNotAuthorizedForClosedEnvironment(authorizedUserData)) {
        return {
            props: {},
        };
    }

    try {
        return {
            redirect: {
                destination: WILDFILE_ROUTES.SERVER.HOMEPAGE.url, // Redirect back to target page
                permanent: false,
            },
        };
    } catch (e) {
        console.log("failed to get beamable account", e);
        return {
            props: {},
        };
    }
};
