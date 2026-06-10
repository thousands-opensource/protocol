import winston from "winston";
import {
    getPapertrailPassword,
    getPapertrailUsername,
    isProdEnvironment,
} from "./util/environmentUtil";

const WINSTON_LOGGER = getWinstonLogger();

function getWinstonLogger() {
    const transport = getLoggingTransport();
    if (!transport) {
        return null;
    }

    return winston.createLogger({
        levels: winston.config.syslog.levels,
        transports: [getLoggingTransport()],
    });
}

/**
 * Creates a winston transport to send logs either to a local file (local) or http (prod)
 */
function getLoggingTransport() {
    if (isProdEnvironment()) {
        const papertrailUsername = getPapertrailUsername();
        const papertrailPassword = getPapertrailPassword();
        if (!papertrailUsername || !papertrailPassword) {
            console.warn("Papertrail credentials not set");
            return;
        }

        return new winston.transports.Http({
            host: "logs.collector.solarwinds.com", // papertrail host
            path: "/v1/log", // papertrail path
            auth: {
                username: papertrailUsername,
                password: papertrailPassword,
            },
            ssl: true,
            level: "info",
        });
    }

    return new winston.transports.File({
        filename: "papertrail.debug.log", // local debug logs
        silent: false,
    });
}

/**
 * Logging Wrapper for console logs and monitoring specifically for Error
 * @param errMsg - Error Message string configured by developer
 * @param e - left as :any (exception) as we want to capture ALL data types via logs
 */
export async function logError(errMsg: string, e?: any) {
    console.error(errMsg, e);
    WINSTON_LOGGER?.error(errMsg, e);
}

/**
 * Logging Wrapper for console logs and monitoring specifically for Info
 * @param infoMsg - Error Message string configured by developer
 */
export async function logInfo(infoMsg: string) {
    console.log(infoMsg);
    WINSTON_LOGGER?.info(infoMsg);
}
