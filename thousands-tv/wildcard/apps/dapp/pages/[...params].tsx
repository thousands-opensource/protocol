import { GetServerSideProps, GetServerSidePropsContext } from "next";
import {
    getExistingServerCodeFromCookie,
    searchAllProviderIdQuery,
    validateServerCode,
} from "@/utils/backend/accountsBackendUtil";
import {
    DEFAULT_SERVER_CODE_PLACEHOLDER,
    WILDFILE_ROUTES,
} from "@/constants/routes";
import {
    getRedirectUrlFromCookiesServerSide,
    getWildcardAccessTokenFromCookiesServerSide,
} from "@/utils/accountAPIUtil";
import {
    getDefaultServerCode,
    isLoggedOutCmsRedirectEnabled,
} from "../utils/environmentUtilWCA";
import {
    AuthorizedUserData,
    authorizeUser,
} from "@/utils/backend/sessionServerUtil";

/**
 * CatchAll component for handling dynamic routes.
 */
const CatchAll = () => {
    return null;
};

const getFirstParamValue = (
    value: string | string[] | undefined
): string | undefined => {
    if (Array.isArray(value)) {
        return value[0];
    }

    return value;
};

const normalizeServerCode = (value?: string): string | undefined => {
    if (!value) {
        return undefined;
    }

    const trimmed = value.replace(/^\//, "");

    if (!trimmed || trimmed === DEFAULT_SERVER_CODE_PLACEHOLDER) {
        return undefined;
    }

    return trimmed;
};

const resolveServerCodeForRedirect = (
    context: GetServerSidePropsContext
): string => {
    const params =
        context.params as Record<string, string | string[] | undefined> | undefined;

    const paramServerCode = normalizeServerCode(
        getFirstParamValue(params?.serverCode)
    );
    if (paramServerCode) {
        return paramServerCode;
    }

    const catchAllServerCode = normalizeServerCode(
        getFirstParamValue(params?.params as string | string[] | undefined)
    );
    if (catchAllServerCode) {
        return catchAllServerCode;
    }

    const queryServerCode = normalizeServerCode(
        getFirstParamValue(
            context.query?.serverCode as string | string[] | undefined
        )
    );
    if (queryServerCode) {
        return queryServerCode;
    }

    const storedRedirectUrl = getRedirectUrlFromCookiesServerSide(context);

    if (storedRedirectUrl) {
        const [firstSegment] = storedRedirectUrl.split("/").filter(Boolean);
        const storedServerCode = normalizeServerCode(firstSegment);
        if (storedServerCode) {
            return storedServerCode;
        }
    }

    return getDefaultServerCode();
};

const getCmsRedirectDestination = (
    context: GetServerSidePropsContext
): string => {
    const serverCode = resolveServerCodeForRedirect(context);
    return `/${serverCode}/cms`;
};

/**
 * Checks if the user is logged in by verifying the presence of a wildcard access token.
 * If the user is not logged in, it returns a redirect object that honors the configured marketing/login destination.
 *
 * @param {GetServerSidePropsContext} context - The context object from getServerSideProps
 * @returns {Object | undefined} A redirect object if the user is not logged in, undefined otherwise
 */
export const redirectIfNotLoggedIn = (context: GetServerSidePropsContext) => {
    const wildcardAccessTokenCookie =
        getWildcardAccessTokenFromCookiesServerSide(context);

    if (!wildcardAccessTokenCookie) {
        if (isLoggedOutCmsRedirectEnabled()) {
            return {
                redirect: {
                    destination: getCmsRedirectDestination(context),
                    permanent: false,
                },
            };
        }

        const encodedRedirectUrl = encodeURIComponent(context.resolvedUrl);
        return {
            redirect: {
                destination: `${WILDFILE_ROUTES.LOGIN.url}?redirectUrl=${encodedRedirectUrl}`,
                permanent: false,
            },
        };
    }

    return undefined;
};

/**
 * Redirects the user based on the provided server code and event ID.
 * If the server code is valid and no event ID is provided, it redirects to the events page.
 * If the server code is invalid, it redirects to the unauthorized page.
 *
 * @param serverCode - The server code extracted from the URL.
 * @param eventId - The event ID extracted from the URL, if present.
 * @returns {Promise<{ redirect: { destination: string; permanent: boolean } } | null>}
 * An object containing the redirect information or null if no redirection is needed.
 */
const redirectServerCode = async (
    context: GetServerSidePropsContext,
    serverCode: string,
    eventId?: string
) => {
    // resolve the server code if from a redirect url
    const storedRedirectUrl = getRedirectUrlFromCookiesServerSide(context);
    let serverCodeVar = serverCode;
    if (serverCode === DEFAULT_SERVER_CODE_PLACEHOLDER && storedRedirectUrl) {
        const extractedServerCode = storedRedirectUrl.split("/")[1];
        serverCodeVar = extractedServerCode || serverCode;
    }

    console.log("Server code after checking redirect URL:", serverCodeVar, serverCode, storedRedirectUrl);

    const validServer = await validateServerCode(serverCodeVar);

    if (!validServer) {
        return {
            redirect: {
                destination: WILDFILE_ROUTES.UNAUTHORIZED.url,
                permanent: false,
            },
        };
    }

    const authorizedUserData: AuthorizedUserData | null = await authorizeUser(
        context
    );

    if (validServer && !eventId) {
        return {
            redirect: {
                destination: `/${serverCode}/home`,
                permanent: false,
            },
        };
    }

    return null;
};

/**
 * Handles the routing of the URL based on the provided server code and event ID.
 *
 * @param context - The context object containing parameters from the request.
 * @returns {Promise<{ props: {}; redirect?: { destination: string; permanent: boolean } }>}
 */
export const getServerSideProps: GetServerSideProps = async (context) => {
    const { params } = context;

    var serverCode = params?.params?.[0] || "";
    const eventId = params?.params?.[1];

    //TEMPCODE to make login not go to unauthorized page
    if (serverCode === "verify" || serverCode === "_next") {
        return {
            redirect: {
                destination: `/${getDefaultServerCode()}`,
                permanent: false,
            },
        };
    }

    // Redirect users to login page with encoded redirect URL if they are not logged in
    const redirectLoginResponse = redirectIfNotLoggedIn(context);
    console.log(`redirectLoginResponse: ${redirectLoginResponse}`);
    if (redirectLoginResponse) {
        return redirectLoginResponse;
    }

    const redirectResponse = await redirectServerCode(
        context,
        serverCode,
        eventId
    );

    console.log("server code Redirect response from redirectServerCode:", redirectResponse);
    if (redirectResponse) {
        return redirectResponse;
    }

    return {
        props: {},
    };
};

export default CatchAll;
