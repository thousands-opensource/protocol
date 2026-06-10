import React, { useEffect } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "../utils/themeUtil";
import Layout from "../layouts/Layout";
import type { AppProps } from "next/app";
import { WagmiConfig, useAccount } from "wagmi";
import { wagmiClient, chains } from "../utils/wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { useIsMounted } from "../hooks/useIsMounted";
import "@rainbow-me/rainbowkit/styles.css";
import "./styles.css";
import Font from "@/components/Font";
import { useRouter } from "next/router";
import { measurePageView } from "@/analytics/googleAnalyticsTag";
import Head from "next/head";
import { getGoogleTagManagerId } from "@/utils/environmentUtil";
import Script from "next/script";
import useUserAnalytics from "@/hooks/useUserAnalytics";
import "@farcaster/auth-kit/styles.css";
import { SessionProvider } from "next-auth/react";
import { AppWrapper } from "@/contexts/globalContextAccounts";
import { CursorEffectProvider } from "@/contexts/cursorEffectContext";
import { ThirdwebProvider } from "thirdweb/react";
import { GlobalLoadingOverlay } from "@/components/GlobalLoadingOverlay";

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
    const isMounted = useIsMounted();
    const router = useRouter();
    const { address } = useAccount();

    // user analytics custom hook
    useUserAnalytics(address);

    useEffect(() => {
        const handleRouteChange = (url: string) => {
            measurePageView(url);
        };
        router.events.on("routeChangeComplete", handleRouteChange);
        return () => {
            router.events.off("routeChangeComplete", handleRouteChange);
        };
    }, [router.events]);

    if (!isMounted) {
        return null;
    }

    return (
        <>
            <Head>
                <meta charSet="UTF-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
                />
                <meta property="og:title" content="Thousands" />
                <meta property="og:description" content="Thousands" />
                <meta
                    property="og:image"
                    content="https://thousands.tv/images/Thousands/T-64.svg"
                />
                <meta property="og:image:alt" content="Thousands Logo" />
                <meta property="og:url" content="https://thousands.tv" />
                <meta property="og:site_name" content="Thousands" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:site" content="@PlayWildcard" />
                <title>Thousands</title>

            </Head>

            {/* Global Site Tag (gtag.js) - Google Analytics */}
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${getGoogleTagManagerId()}`}
            />
            <Script id="gtag-inline" strategy="afterInteractive">
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());

                    gtag('config', '${getGoogleTagManagerId()}', {
                        page_path: window.location.pathname,
                    });
                `}
            </Script>
            <WagmiConfig client={wagmiClient}>
                <SessionProvider session={session}>
                    <ThirdwebProvider>
                        <ChakraProvider theme={theme}>
                            <CursorEffectProvider>
                                <Font />
                                <RainbowKitProvider
                                    chains={chains}
                                    theme={darkTheme({
                                        accentColor: "#007AFC",
                                        accentColorForeground: "white",
                                        borderRadius: "medium",
                                        fontStack: "system",
                                        overlayBlur: "small",
                                    })}
                                >
                                    <AppWrapper>
                                        <Layout>
                                            <GlobalLoadingOverlay />
                                            <Component {...pageProps} />
                                        </Layout>
                                    </AppWrapper>
                                </RainbowKitProvider>
                            </CursorEffectProvider>
                        </ChakraProvider>
                    </ThirdwebProvider>
                </SessionProvider>
            </WagmiConfig>
        </>
    );
}

export default MyApp;
