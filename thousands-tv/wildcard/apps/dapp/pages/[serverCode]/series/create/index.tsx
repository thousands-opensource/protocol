import React from "react";
import connectToDb from "@/db/connectToDb";
import { redirectIfNotLoggedIn } from "@/pages/[...params]";
import { getWildcardAccessTokenFromCookiesServerSide } from "@/utils/accountAPIUtil";
import { AuthorizedUserData } from "@/utils/backend/sessionServerUtil";
import { checkUserAuthorizedForPage } from "@/utils/profileUtil";
import { redirectUserIfUnauthorized } from "@/utils/sessionUtil";
import "react-datepicker/dist/react-datepicker.css";

import { WILDFILE_ROUTES } from "@/constants/routes";
import { formatRouteConfigUrl } from "@/utils/routeUtil";
import { GetServerSideProps } from "next";
import { ONE_WEEK_MS } from "@/constants/constants";
import {
    CreateSeriesCardProps,
    CreateSeriesFormValues,
} from "@/features/SeriesForm/interfaces";
import SeriesForm from "@/features/SeriesForm";

const CreateSeriesForm: React.FC<CreateSeriesCardProps> = ({ serverCode }) => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + ONE_WEEK_MS);

    const initialValues: CreateSeriesFormValues = {
        serverCode,
        seriesName: "",
        startDate: today,
        endDate: nextWeek,
        imageUrl: "",
        backgroundImageUrl: "",
        seriesDescription: "",
        seriesPointConfiguration: "",
    };

    return (
        <SeriesForm
            initialValues={initialValues}
            serverCode={serverCode}
            isCreate={true}
        />
    );
};

export default CreateSeriesForm;

export const getServerSideProps: GetServerSideProps = async (context) => {
    const serverCode = context?.params?.serverCode as string;
    const backToSeriesBaseUrl =
        WILDFILE_ROUTES.SERVER.SERIES_DASHBOARD.BASE.url;
    const backToSeriesUrl = formatRouteConfigUrl(backToSeriesBaseUrl, {
        serverCode,
    });

    try {
        await connectToDb();

        const wildcardAccessTokenCookie =
            getWildcardAccessTokenFromCookiesServerSide(context);

        // Authorize the user and check if they have the required role
        const userAuthorizedForPageResult = await checkUserAuthorizedForPage(
            context
        );
        if (!userAuthorizedForPageResult.success) {
            // redirect the user if they are not authorized
            return userAuthorizedForPageResult.data as {
                redirect: { destination: string; permanent: boolean };
            };
        }

        // Redirect users to login page with encoded redirect URL if they are not logged in
        const redirectLoginResponse = redirectIfNotLoggedIn(context);
        if (redirectLoginResponse) {
            return redirectLoginResponse;
        }
        const authorizedUserData: AuthorizedUserData =
            userAuthorizedForPageResult.data as AuthorizedUserData;

        if (!authorizedUserData) {
            return {
                redirect: {
                    destination: "/login",
                    permanent: false,
                },
            };
        }

        const { userDB, serverDoc } = authorizedUserData;
        const redirect = redirectUserIfUnauthorized(
            wildcardAccessTokenCookie,
            userDB,
            context
        );

        if (redirect) {
            return redirect;
        }

        if (!serverDoc) {
            console.error("Unable to find server", serverCode);
            return {
                redirect: {
                    destination: backToSeriesUrl,
                    permanent: false,
                },
            };
        }

        return {
            props: {
                serverCode,
            },
        };
    } catch (error) {
        console.error("Failed to fetch server data:", error);
        return {
            redirect: {
                destination: backToSeriesUrl,
                permanent: false,
            },
        };
    }
};
