import React, { useState } from "react";
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
import {
    SeriesCardProps,
    SeriesFormValues,
} from "@/features/SeriesForm/interfaces";
import SeriesForm from "@/features/SeriesForm";

const UpdateSeriesForm: React.FC<SeriesCardProps> = ({
    seriesId,
    serverCode,
    seriesName,
    startDate,
    endDate,
    imageUrl,
    backgroundImageUrl,
    seriesDescription,
    seriesPointConfiguration,
}) => {
    const initialValues: SeriesFormValues = {
        seriesId,
        serverCode,
        seriesName,
        startDate: new Date(startDate), // Already a timestamp from getServerSideProps
        endDate: new Date(endDate), // Already a timestamp from getServerSideProps
        imageUrl,
        backgroundImageUrl,
        seriesDescription,
        seriesPointConfiguration,
    };

    return <SeriesForm initialValues={initialValues} serverCode={serverCode} />;
};

export default UpdateSeriesForm;

export const getServerSideProps: GetServerSideProps = async (context) => {
    const seriesId = context?.params?.seriesId as string;
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

        const seriesDoc = serverDoc?.series?.find(
            (s) => s._id?.toString() === seriesId
        );

        if (!seriesDoc) {
            console.error(
                "Unable to find series",
                seriesId,
                " in server",
                serverCode
            );
            return {
                redirect: {
                    destination: backToSeriesUrl,
                    permanent: false,
                },
            };
        }

        return {
            props: {
                seriesId,
                seriesDescription: seriesDoc.seriesDescription,
                seriesName: seriesDoc.seriesName,
                startDate: new Date(seriesDoc.startDate).getTime(),
                endDate: new Date(seriesDoc.endDate).getTime(),
                imageUrl: seriesDoc.imageUrl,
                backgroundImageUrl: seriesDoc.backgroundImageUrl,
                seriesPointConfiguration:
                    seriesDoc.seriesPointConfiguration || "",
                serverCode,
            },
        };
    } catch (error) {
        console.error("Failed to fetch series data:", error);
        return {
            redirect: {
                destination: backToSeriesUrl,
                permanent: false,
            },
        };
    }
};
