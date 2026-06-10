import React, { useEffect } from "react";
import { Box, Text } from "@chakra-ui/react";
// import { useAppContext } from "@/context/globalContext";
import { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { getUserSessionObj } from "@/utils/userSession";
// import ProfileCard from "@/components/profileCard";
import cookie from "cookie";
// import { useAppContext } from "@/contexts/globalContextAccounts";

interface ProfileData {
    email: string;
    displayName: string;
    timezone: string;
    defaultStreamUrl: string;
}

interface ProfilerProps {
    accountData: any;
    userDetails: any;
    findUser: any;
    userDB: string;
}

function Profile({
    accountData: accountDataProps,
    findUser: findUserProps,
}: ProfilerProps) {
    const { data: session } = useSession();
    const user = getUserSessionObj(session);

    // const { setAccountData, setIsLoggedIn, setFindUser, findUser } =
    //     useAppContext();

    // useEffect(() => {
    //     // Only try to fetch account details if there's an access token
    //     if (accountDataProps || user) {
    //         setAccountData(accountDataProps);
    //         setFindUser(findUserProps);
    //         setIsLoggedIn(true);
    //     } else {
    //         setIsLoggedIn(false);
    //     }
    // }, [accountDataProps]);

    return (
        <Box>Dashboard/Profile Page</Box>
        // <DashboardLayout>
        //     Profile
        //     {/* <Box>
        //         {/* <UserProfile /> */}
        //     {/* <DeleteAccountModal /> */}
        //     <Text fontWeight="bold" fontSize={"lg"} mb={2}>
        //         Widfile Account Details:
        //     </Text>
        //     {/* Create Profile Card and Retrieve Mongo Object */}
        //     <ProfileCard findUser={findUserProps} />
        // </DashboardLayout>
    );
}

export default Profile;

export const getServerSideProps: GetServerSideProps = async (context) => {
    // const cookies = cookie.parse(context.req.headers.cookie || "");
    // const accessTokenProviderBeamableCookie =
    //     cookies.accessTokenProviderBeamable; // store emai, and relvant in
    // const accessTokenViaOTP = cookies.accessToken; // Get the access token from the cookies

    // console.log("COOKIES 🍪🍪🍪", cookies);

    // if (!accessTokenProviderBeamableCookie) {
    //     const errMsg = `No token. Redirecting to login page.`;
    //     console.log(errMsg);

    //     return {
    //         redirect: {
    //             destination: "/login", // Redirect to the login page
    //             permanent: false,
    //         },
    //     };
    // }

    try {
        // const [accountResponse, userResponse] = await fetchAccountAndUser(
        //     accessTokenProviderBeamableCookie
        // );

        // console.log("event dashbaord", accountResponse, userResponse);
        return {
            props: {
                // accountData: accountResponse.data,
                // findUser: userResponse.data,
            },
        };
    } catch (e) {
        console.log("failed to get beamable account", e);
        return {
            props: {},
        };
    }
};
