// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { CaptureConsole as CaptureConsoleIntegration } from "@sentry/integrations";
import { getEnvironment, getSentryDsn } from "./utils/environmentUtil";
import { SENTRY_IGNORED_ERRORS } from "./utils/sentryUtils";

if (getSentryDsn()) {
    Sentry.init({
        dsn: getSentryDsn(),

        // Capture 100% of transactions in production (adjust if needed)
        tracesSampleRate: 1,

        debug: false, // No Sentry debug logs in production

        // Session Replay settings
        replaysOnErrorSampleRate: 1.0, // This sets the sample rate to be 10%. You may want this to be 100% while
        // in development and sample at a lower rate in production
        replaysSessionSampleRate: 0.1,

        // Capture logs into sentry from the console log level error and higher
        integrations: [
            new Sentry.Replay({
                // Additional Replay configuration goes in here, for example:
                maskAllText: true,
                blockAllMedia: true,
            }),
            new CaptureConsoleIntegration({
                // defaults to ['log', 'info', 'warn', 'error', 'debug', 'assert']
                levels: ["error"],
            }),
        ],

        environment: getEnvironment(),

        /**
         * Filter out noisy errors before sending to Sentry
         */
        beforeSend(event, hint) {
            const error = hint?.originalException;
            let message = event?.message || "";

            if (error && typeof error === "object" && "message" in error) {
                message = (error as any).message || message;
            }

            if (
                SENTRY_IGNORED_ERRORS.some((ignored) =>
                    message.toLowerCase().includes(ignored.toLowerCase())
                )
            ) {
                return null;
            }

            if (event.level !== "error") {
                return null;
            }

            return event;
        },

        maxBreadcrumbs: 50,
        attachStacktrace: true,
        sendDefaultPii: false,
    });
}
