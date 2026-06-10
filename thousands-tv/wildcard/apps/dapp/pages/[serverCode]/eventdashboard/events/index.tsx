import React from "react";
import { Box } from "@chakra-ui/react";
import {
    AuthorizedUserData,
    authorizeUser,
} from "@/utils/backend/sessionServerUtil";
import { GetServerSideProps } from "next";
import { redirectUserIfUnauthorized } from "@/utils/sessionUtil";

function Events() {
    return (
        <>
            Events
            <Box></Box>
        </>
    );
}

export default Events;

export const getServerSideProps: GetServerSideProps = async (context) => {
    // Authorize the user and check if they have the required role
    const authorizedUserData: AuthorizedUserData | null = await authorizeUser(
        context
    );

    if (!authorizedUserData) {
        return {
            redirect: {
                destination: "/login",
                permanent: false,
            },
        };
    }

    const {
        userDB,
        connectedUserDBProviderId,
        connectedUserDBEmail,
        wildcardAccessToken,
    } = authorizedUserData;
    const redirect = redirectUserIfUnauthorized(
        wildcardAccessToken,
        userDB,
        context
    );

    if (redirect) {
        return redirect;
    }

    return {
        props: {},
    };
};
