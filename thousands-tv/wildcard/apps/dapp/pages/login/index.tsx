import { useToast } from "@chakra-ui/react";
import React, { useEffect } from "react";
import { GetServerSideProps, NextApiResponse } from "next";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { WILDFILE_ROUTES } from "@/constants/routes";
import router from "next/router";
import { mapErrorToMessage } from "@/utils/accountsUtil";
import {
    authorizeUser,
    AuthorizedUserData,
} from "@/utils/backend/sessionServerUtil";
import { LoginStaticView } from "@/features/LoginOrSignUpFlow/_ui/LoginStaticView";
import { checkUserNotAuthorizedForClosedEnvironment } from "@/utils/profileUtil";
import { clearNextAuthSessionTokenCookie } from "@/utils/backend/accountsBackendUtil";

interface LoginProps {
    userDetails: any;
}

function Login({ userDetails: userDetailsProps }: LoginProps) {
    const { userDB } = useWildfileUserContext();
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

    return <LoginStaticView useThousandsBackground />;
}

export default Login;

// check if user is authenticated and has a valid token if not return back to login page
// signed in OAuth user requires to get an access token to fully login to WC apis
export const getServerSideProps: GetServerSideProps = async (context) => {
    const authorizedUserData: AuthorizedUserData | null = await authorizeUser(
        context
    );

    if (!authorizedUserData) {
        clearNextAuthSessionTokenCookie(context.res as NextApiResponse);

        return {
            props: {},
        };
    }

    if (!authorizedUserData.wildcardAccessToken) {
        clearNextAuthSessionTokenCookie(context.res as NextApiResponse);

        return {
            props: {},
        };
    }

    if (checkUserNotAuthorizedForClosedEnvironment(authorizedUserData)) {
        return {
            props: {},
        };
    }

    try {
        const { redirectUrl } = context.query;
        if (redirectUrl) {
            const redirectUrlString = redirectUrl as string;

            return {
                redirect: {
                    destination: redirectUrlString,
                    permanent: false,
                },
            };
        }

        return {
            redirect: {
                destination: WILDFILE_ROUTES.HOME.url,
                permanent: false,
            },
        };
    } catch (e) {
        console.log("Failed to login into thousands:", e);
        return {
            props: {},
        };
    }
};
