import React from "react";
import { VerifyTOTPModalOnSignIn } from "../../profile/[tab]/_ui/two-factor-authenitcation-settings";
import { useSearchParams } from "next/navigation";
import connectToDb from "@/db/connectToDb";
import { GetServerSideProps } from "next";
import BackgroundLayout from "@/layouts/BackgroundLayout";
import { findOneUserByQuery } from "@repo/schemas";
import {
    AuthorizedUserData,
    authorizeUser,
} from "@/utils/backend/sessionServerUtil";
import { redirectUserIfUnauthorized } from "@/utils/sessionUtil";

interface ValidateTOTPProps {
    userDB: string;
}

function ValidateTOTP({ userDB }: ValidateTOTPProps) {
    const searchParams = useSearchParams();
    const search = searchParams.get("email");

    const userDBParsed = JSON.parse(userDB);

    return (
        <BackgroundLayout>
            <VerifyTOTPModalOnSignIn emailViaNextAuthBool={true} />
        </BackgroundLayout>
    );
}

export default ValidateTOTP;

export const getServerSideProps: GetServerSideProps = async (context) => {
    // Server Session

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

    try {
        return {
            props: {
                userDB: JSON.stringify(userDB),
            },
        };
    } catch (e) {
        console.log("failed to get beamable account", e);
        return {
            props: {},
        };
    }
};
