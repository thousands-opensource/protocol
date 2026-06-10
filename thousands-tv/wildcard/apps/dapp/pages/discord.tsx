import { DiscordLoginStaticView } from "@/features/LoginOrSignUpFlow/_ui/DiscordLoginStaticView";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Head from "next/head";
import { getCookieValue, getDiscordLoginRedirectUrl } from "@/utils/accountsUtil";
import { COOKIES_USER_SERVER_PREFERENCES } from "@/utils/accountAPIUtil";

export default function DiscordLogin() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        // If user is already authenticated, redirect to user dashboard
        if (status === "authenticated" && session) {
            // Get server code from cookie
            const serverPreferences = getCookieValue(COOKIES_USER_SERVER_PREFERENCES);
            const serverCode = serverPreferences?.serverCode || "thousands";
            const redirectUrl = getDiscordLoginRedirectUrl(serverCode);
            router.push(redirectUrl);
        }
    }, [status, session, router]);

    // Show loading state while checking authentication
    if (status === "loading") {
        return (
            <>
                <Head>
                    <title>Login with Discord - Thousands.tv</title>
                    <meta
                        name="description"
                        content="Login to Thousands.tv with your Discord account"
                    />
                </Head>
                <DiscordLoginStaticView />
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Login with Discord - Thousands.tv</title>
                <meta
                    name="description"
                    content="Login to Thousands.tv with your Discord account"
                />
            </Head>
            <DiscordLoginStaticView />
        </>
    );
}