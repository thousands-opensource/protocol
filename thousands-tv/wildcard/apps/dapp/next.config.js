const withVideos = require("next-videos");

module.exports = {
    transpilePackages: [
        "ui",
        "@repo/interfaces",
        "@repo/schemas",
        "@repo/utils",
    ],
    ...withVideos({
        reactStrictMode: true,
        trailingSlash: true,
        images: {
            remotePatterns: [
                {
                    protocol: "https",
                    hostname: "**",
                },
            ],
        },
    }),
    env: {
        TWITTER_BASIC_AUTH: process.env.TWITTER_BASIC_AUTH,
        DEV_TWITTER_BASIC_AUTH: process.env.DEV_TWITTER_BASIC_AUTH,
        DEV_TWITCH_CLIENT_ID: process.env.DEV_TWITCH_CLIENT_ID,
        DEV_TWITCH_CLIENT_SECRET: process.env.DEV_TWITCH_CLIENT_SECRET,
        DEV_TWITTER_CLIENT_ID: process.env.DEV_TWITTER_CLIENT_ID,
    },
    webpack: function (config, options) {
        config.experiments = {
            ...config.experiments,
            asyncWebAssembly: true,
            layers: true,
        };

        return config;
    },
    async rewrites() {
        return [
            {
                source: "/twitter/v2/:path*",
                destination: "https://api.twitter.com/2/:path*",
            },
            {
                source: "/twitch/oauth2/:path*",
                destination: "https://id.twitch.tv/oauth2/:path*",
            },
            {
                source: "/twitch/helix/:path*",
                destination: "https://api.twitch.tv/helix/:path*",
            },
        ];
    },
};

// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
    module.exports,
    {
        // For all available options, see:
        // https://github.com/getsentry/sentry-webpack-plugin#options

        // Suppresses source map uploading logs during build
        silent: true,

        org: "wildcard-alliance",
        project: "wildcard-dapp",
    },
    {
        // For all available options, see:
        // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

        // Upload a larger set of source maps for prettier stack traces (increases build time)
        widenClientFileUpload: true,

        // Transpiles SDK to be compatible with IE11 (increases bundle size)
        transpileClientSDK: true,

        // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
        tunnelRoute: "/monitoring",

        // Hides source maps from generated client bundles
        hideSourceMaps: true,

        // Automatically tree-shake Sentry logger statements to reduce bundle size
        disableLogger: true,
    }
);
