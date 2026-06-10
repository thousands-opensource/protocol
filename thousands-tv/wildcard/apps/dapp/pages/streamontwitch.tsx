import { TwitchLoginStaticView } from "@/features/LoginOrSignUpFlow/_ui/TwitchLoginStaticView";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Head from "next/head";
import {
    getCookieValue,
    getTwitchLoginRedirectToStreamerDashboardUrl,
} from "@/utils/accountsUtil";
import { COOKIES_USER_SERVER_PREFERENCES } from "@/utils/accountAPIUtil";
import { Spinner } from "@chakra-ui/react";

export default function TwitchLogin() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        // If user is already authenticated, redirect to user dashboard
        if (status === "authenticated" && session) {
            // Get server code from cookie
            const serverPreferences = getCookieValue(
                COOKIES_USER_SERVER_PREFERENCES
            );
            const serverCode = serverPreferences?.serverCode || "thousands";
            const redirectUrl =
                getTwitchLoginRedirectToStreamerDashboardUrl(serverCode);
            router.push(redirectUrl);
        }
    }, [status, session, router]);

    // Show loading state while checking authentication
    if (status === "loading") {
        return (
            <>
                <Head>
                    <title>Login with Twitch - Thousands.tv</title>
                    <meta
                        name="description"
                        content="Login to Thousands.tv with your Twitch account"
                    />
                </Head>
                <TwitchLoginStaticView />
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Login with Twitch - Thousands.tv</title>
                <meta
                    name="description"
                    content="Login to Thousands.tv with your Twitch account"
                />
            </Head>
            <TwitchLoginStaticView />
        </>
    );
}
