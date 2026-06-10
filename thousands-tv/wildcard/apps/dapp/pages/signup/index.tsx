import MainLayout from "@/layouts/MainLayout";
import { Flex } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { WILDFILE_ROUTES } from "@/constants/routes";
import { authorizeUser } from "@/utils/backend/sessionServerUtil";
import LoginOrSignUpFlow from "@/features/LoginOrSignUpFlow";

interface SignupProps {
    accountData: any;
    userDetails: any;
    findUser: any;
    setFindUser: any;
}

function Signup({
    accountData: accountDataProps,
    userDetails: userDetailsProps,
    findUser: findUserProps,
}: SignupProps) {
    const { userDB, setUserDB } = useWildfileUserContext();
    const [isSignUp, setIsSignUp] = useState<boolean>(false);

    const { setIsLoggedIn } = useWildfileUserContext();

    useEffect(() => {
        if (userDetailsProps || userDB) {
            setIsLoggedIn(true);
        } else {
            setIsLoggedIn(false);
        }
    }, [userDetailsProps]);

    return (
        <MainLayout>
            <Flex flexDirection="column" justifyContent="center" p="20px">
                <LoginOrSignUpFlow
                    key={isSignUp ? "signup" : "login"}
                    isSignUp={isSignUp}
                    setIsSignUp={setIsSignUp}
                />
            </Flex>
        </MainLayout>
    );
}

export default Signup;

// check if user is authenticated and has a valid token if not return back to login page
// signed in OAuth user requires to get an access token to fully login to WC apis
export const getServerSideProps: GetServerSideProps = async (context) => {
    const authorizedUserData = await authorizeUser(context);

    if (!authorizedUserData) {
        const errMsg = `User not found. Redirecting to login page.`;
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

    try {
        return {
            redirect: {
                destination: WILDFILE_ROUTES.SERVER.WILDFILE.BASE.url, // Redirect to the dashboard page
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
