import {
    ALPHA_SERIES_ZERO_BG_COLOR,
    DEFAULT_WILDPASS_HOLDER_COLOR_BADGE,
    TWITTER_SHARE_WEB_INTENT_BASE_URL,
    WALLET_LINKED,
    WILDCARD_SWAG_CONTRACT_ADDRESS,
    WILDPASS_HOLDER,
    WildpassColors,
} from "@/constants/constants";
import { NftContractTokenBalance, OwnedNft } from "alchemy-sdk";
import { ethers } from "ethers";
import { Dispatch, SetStateAction } from "react";
import {
    ADDRESS_COOKIE,
    MSG_COOKIE,
    SIG_COOKIE,
    restoreNewlinesFromCookie,
} from "./oauthUtil";
import { LEADERBOARDS } from "@/features/Wildfile/WildFileProfile/Leaderboard";
import AlphaSeriesOneRegular from "@/public/images/WildfileAssets/Leaderboard/AlphaSeriesOneRegular.svg";
import AlphaSeriesOneSmall from "@/public/images/WildfileAssets/Leaderboard/AlphaSeriesOneSmall.svg";
import { IEvent, ISeries, IStage, IUser } from "@repo/interfaces";
import { LoggingIdentifier, IdentifierType } from "@repo/interfaces";
import type { NextApiRequest } from "next";

export function isLinkWalletGuidExpired(expiresAt?: Date) {
    if (!expiresAt) {
        return true;
    }

    const expiresAtDate = new Date(expiresAt);
    const timeLeft = expiresAtDate.getTime() - Date.now();
    return timeLeft <= 0;
}

/**
 * Shortens a string by removing the middle characters and replacing them with ellipses if its length is greater than 27 (default) characters
 */
export const shorten = (
    str: string | undefined,
    options?: { length?: number; isAddress?: boolean }
) => {
    const { length = 27, isAddress = false } = options || { isAddress: false };
    if (!str) {
        return "";
    }

    if (str.length < length) {
        return str;
    }

    if (!isAddress) {
        return `${str.slice(0, 8)}...${str.slice(-3)}`;
    }

    return `${str.slice(0, 6)}...${str.slice(str.length - 4)}`;
};

export function isBrowser(): boolean {
    return typeof window !== "undefined";
}

/**
Verify the signature of a message based on user signed message
@param message - The message to verify.
@param signature - The signature to verify.
@param address - The expected address of the signer.
@returns true if the signature is valid, false otherwise.
*/
export const verifySignedMessage = async (
    message: any,
    signature: any,
    address: any
) => {
    try {
        const signerAddr = await ethers.utils.verifyMessage(message, signature);
        if (signerAddr !== address) {
            return false;
        }
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
};

/**
Verify the signature of a message based on user signed message
@param message - The message to verify.
@param signature - The signature to verify.
@param address - The expected address of the signer.
@returns true if the signature is valid, false otherwise.
*/
export const verifySignedMessageFromCookies = async (
    cookies: Partial<{
        [key: string]: string;
    }>
) => {
    try {
        const sigCookie = cookies[SIG_COOKIE];
        const addressCookie = cookies[ADDRESS_COOKIE];
        const msgCookie = cookies[MSG_COOKIE];
        if (!msgCookie || !sigCookie || !addressCookie) return false;
        // restore signature message to it's original form with newlines so that we can verify it
        const reformatedMsgCookie = restoreNewlinesFromCookie(msgCookie);
        const sigVerifification = await verifySignedMessage(
            reformatedMsgCookie,
            sigCookie,
            addressCookie
        );
        return sigVerifification;
    } catch (err) {
        console.log(err);
        return false;
    }
};

/**
 * Converts a string in hexadecimal format (starting with '0x') to a regular string.
 */
export const hexToString = (regularString: `0x${string}` | undefined) => {
    if (regularString === undefined) {
        return "";
    }
    return `0x${regularString}`;
};

/**
 * Determines if the current onboarding step is completed based on the user wallet address and isWalletAddress being valid
 * @param step - the current step number
 * @param isWalletLinkedToDiscord - boolean referring to whether the wallet address is linked to discord user
 * @param walletAddress - wallet address of user
 */
export const handleCompletedStep = (
    step: number,
    isWalletLinkedToDiscord: boolean,
    walletAddress?: string
) => {
    if (step === 0 && (isWalletLinkedToDiscord || walletAddress)) {
        return true;
    }
    return isWalletLinkedToDiscord;
};

/**
 * Returns the description to display for linking the wallet, depending on whether the wallet is already linked to Discord.
 * @param isWalletLinkedToDiscord - boolean referring to whether the wallet address is linked to discord user
 * @param walletAddress - wallet address of user
 */
const displayLinkWalletDescription = (
    isWalletLinkedToDiscord: boolean,
    walletAddress?: string
) => {
    return isWalletLinkedToDiscord || walletAddress ? WALLET_LINKED : "";
};

/**
 * Returns the description based on whether the wallet is linked to Discord or not
 */
export const handleDescription = (
    isWalletLinkedToDiscord: boolean,
    walletAddress?: string
) => {
    return displayLinkWalletDescription(isWalletLinkedToDiscord, walletAddress);
};

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
export const generateRandomString = (length: number) => {
    let text = "";
    const possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

/**
 * Get variable from local storage
 * @param key - key of variable to get
 * @retrusn string or undefined
 */
export const getLocalStorageValue = (key: string) => {
    let value;
    if (typeof window !== "undefined") {
        value = window.localStorage.getItem(key);
    }
    return value;
};

/**
 * Sets local storage value
 * @param key - key to use for variable
 * @param value - value to use for variable
 */
export const setLocalStorageValue = (key: string, value: string) => {
    if (typeof window !== "undefined") {
        window.localStorage.setItem(key, value);
    }
};

/***
 * https://developer.twitter.com/en/docs/twitter-for-websites/tweet-button/overview
 * Generates a 'Share to Twitter' Web Intent URL including the given tweet text and image URL (hashtag optional)
 * @param tweetText - text to include in the tweet
 * @param tweetImageURL - image URL to include in the tweet
 * @param hashtags - optional array of hashtags to include in the tweet
 * @returns {string} - the generated twitter web intent URL
 */
export function generateShareToTwitterWebIntentURL(
    tweetText: string,
    tweetImageURL: string,
    hashtags?: string[]
): string {
    const encodedTweetText = encodeURIComponent(tweetText);
    const encodedTweetImageURL = encodeURIComponent(tweetImageURL);

    const hashtagQuery =
        hashtags && hashtags.length > 0
            ? `&hashtags=${hashtags
                .map((tag) => encodeURIComponent(tag))
                .join(",")}`
            : "";

    return `${TWITTER_SHARE_WEB_INTENT_BASE_URL}?text=${encodedTweetText}%20${encodedTweetImageURL}${hashtagQuery}`;
}

/**
 * Helper function to determine how many of each wildpass color a user has based on owned nft data returned from alchemy api
 * @param wildpassNfts - wildpasses to iterate through
 * @returns object contiaing color's as key and amount of that color as key value
 */
export function getColorAmountForWildpasses(wildpassNfts: OwnedNft[]): {
    [color: string]: number;
} {
    // create object containing info on amount of each wildpass color
    let filteredNfts: { [color: string]: number } = {};

    // sort though nfts containing color attribute
    for (const nft of wildpassNfts) {
        const attributes = nft.raw.metadata?.attributes;
        if (!attributes) continue;

        const colorAttribute = attributes.find(
            (attr: Record<string, any>) => attr["trait_type"] === "Color"
        );
        if (!colorAttribute) continue;

        const rawValue = colorAttribute["value"];
        const colorValue: keyof typeof WildpassColors = rawValue.toUpperCase();
        const bgColor = WildpassColors[colorValue];

        if (filteredNfts[bgColor]) {
            filteredNfts[bgColor] += 1;
        } else {
            filteredNfts[bgColor] = 1;
        }
    }
    return filteredNfts;
}

export function getTokenIdModuloCounts(
    tokens: NftContractTokenBalance[]
): Record<number, number> {
    const numWildpasses = Object.keys(WildpassColors).length;
    // Initialize object with all remainders set to 0
    const colorCounts: Record<number, number> = {};
    for (let i = 0; i < numWildpasses; i++) {
        colorCounts[i] = 0;
    }

    // Count the actual tokens
    tokens.forEach((token) => {
        const remainder = Number(token.tokenId) % numWildpasses;
        colorCounts[Number(remainder)] += Number(token.balance);
    });

    return colorCounts;
}

export function getNumberOfFullSpectrumSets(tokens: NftContractTokenBalance[]) {
    const colorCounts = getTokenIdModuloCounts(tokens);
    return Math.min(...Object.values(colorCounts));
}

/**
 * Fetch first available wildpass color page owner owns
 * @param pageOwnerWildpassColors - page owner of wildpass color(hex)
 * @returns string representation of wildpass color
 */
export function getFirstWildpassColor(
    pageOwnerWildpassColors: string[]
): string {
    let wildpassColor = DEFAULT_WILDPASS_HOLDER_COLOR_BADGE;
    const wildpassColors = Object.keys(WildpassColors);
    for (const pageOwnerWildpassColor of pageOwnerWildpassColors) {
        const index = Object.values(WildpassColors).indexOf(
            pageOwnerWildpassColor as WildpassColors
        );

        if (index < 0) {
            continue;
        }

        wildpassColor = wildpassColors[index].toLowerCase();
        break;
    }

    return wildpassColor;
}

/**
 * Gets badge id associate with wildpass color
 * @param badgeId - a badge id
 * @param pageOwnerWildpassColors - page owner of wildpass color(hex)
 * @returns get specific badge id represent particular wildpass color if badge id is wildpass holder
 */
export function getBadgeId(badgeId: string, pageOwnerWildpassColors: string[]) {
    if (badgeId !== WILDPASS_HOLDER) {
        return badgeId;
    }

    const wildpassColor = getFirstWildpassColor(pageOwnerWildpassColors);
    return `${badgeId}-${wildpassColor}`;
}

/**
 * Get string representing how long ago provided date was
 * @param date - time to get time difference from
 * @returns string
 */
export function getTimeDifference(date: Date): string {
    const now = new Date();
    const diffInMilliseconds = now.getTime() - new Date(date).getTime();
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const month = 30 * day;
    const year = 365 * day;

    if (diffInMilliseconds < hour) {
        const diffInMinutes = Math.floor(diffInMilliseconds / minute);
        return `${diffInMinutes} min ago`;
    } else if (diffInMilliseconds < day) {
        const diffInHours = Math.floor(diffInMilliseconds / hour);
        return `${diffInHours} hr ago`;
    } else if (diffInMilliseconds < month) {
        const diffInDays = Math.floor(diffInMilliseconds / day);
        return `${diffInDays} day${addPlural(diffInDays)} ago`;
    } else if (diffInMilliseconds < year) {
        const diffInMonths = Math.floor(diffInMilliseconds / month);
        const remainingDays = Math.floor(
            (diffInMilliseconds - diffInMonths * month) / day
        );
        return `${diffInMonths} month${addPlural(
            diffInMonths
        )} ${remainingDays} day${addPlural(remainingDays)} ago`;
    } else {
        const diffInYears = Math.floor(diffInMilliseconds / year);
        const remainingMonths = Math.floor(
            (diffInMilliseconds - diffInYears * year) / month
        );
        const remainingDays = Math.floor(
            (diffInMilliseconds -
                diffInYears * year -
                remainingMonths * month) /
            day
        );
        return `${diffInYears} yr${addPlural(
            diffInYears
        )} ${remainingMonths} month${addPlural(
            remainingMonths
        )} ${remainingDays} day${addPlural(remainingDays)} ago`;
    }
}

/**
 * returns "s" for values that are plural
 * @param num - number to check
 * @returns string
 */
const addPlural = (num: number) => {
    if (num > 1) return "s";
    return "";
};

/**
 * Copies text to clipboard
 * @param text - text to copy
 * @param setText - sets the text of the tooltip surrounding the text
 */
export const copyTextToClipboard = (
    text: string,
    setText?: Dispatch<SetStateAction<string>>
) => {
    // Use the modern Clipboard API if available
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            if (setText) {
                setText("Copied!");
            }
        });
        return;
    }
    // Create a temporary textarea element to hold the text
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);

    // Select the text in the textarea
    textarea.select();

    // Execute the copy command
    document.execCommand("copy");

    // Remove the temporary textarea
    document.body.removeChild(textarea);
    if (setText) {
        setText("Copied!");
    }
};

/**
 * Get url to swag pin on MagicEden
 * @param tokenId - Swag pin id to link to
 * @returns string
 */
export function getSwagPinMagicEdenLink(tokenId: string) {
    return `https://magiceden.io/item-details/polygon/${WILDCARD_SWAG_CONTRACT_ADDRESS}/${tokenId}`;
}

/**
 * Get local image from image file directory
 * @param tabDirectory - different trophy image design in different directory
 * @param rank - represents which tropy to fetch from gold(1), silver(2), bronze(3)
 * @returns string respresentation of local image
 */
export const getTrophyImg = (tabDirectory: string, rank: number) => {
    const imgDir = "/images/WildfileAssets/Leaderboard/trophy";
    switch (tabDirectory) {
        case "main":
            return `${imgDir}/main/${rank}.svg`;
        case "leaderboard":
            return `${imgDir}/leaderboard/${rank}.svg`;
        default:
            return `${imgDir}/table/${rank}.svg`;
    }
};

/**
 * Get the hex color for the leaderboardId
 * @param leaderboardId - id of leaderboard we are looking to find the color of
 * @returns - hex color
 */
export function getBackgroundColorFromLeaderboardList(leaderboardId: string) {
    const matchindLeaderboard = LEADERBOARDS.find(
        (currLeaderboard) => currLeaderboard.leaderboardId === leaderboardId
    );
    const backgroundColor = matchindLeaderboard?.backgroundColor
        ? matchindLeaderboard.backgroundColor
        : ALPHA_SERIES_ZERO_BG_COLOR;
    return backgroundColor;
}

/**
 * Get icon source for the leaderboard
 * @param leaderboardId - id of leaderboard we are looking to find the color of
 * @param isFitToAccordion - boolean representation to determine whether to fit icon in accordion
 * @returns image/icon source
 */
export function getBadgeIconFromLeaderboardList(
    leaderboardId: string,
    isFitToAccordion: boolean = false
) {
    const matchindLeaderboard = LEADERBOARDS.find(
        (currLeaderboard) => currLeaderboard.leaderboardId === leaderboardId
    );

    if (isFitToAccordion) {
        return (
            matchindLeaderboard?.getIconSrc(isFitToAccordion) ||
            AlphaSeriesOneSmall.src
        );
    }

    return (
        matchindLeaderboard?.getIconSrc(isFitToAccordion) ||
        AlphaSeriesOneRegular.src
    );
}

export function getNHourExpirationIsoDate(n: number) {
    const futureDatetime: Date = new Date(
        new Date().getTime() + n * 60 * 60 * 1000
    );
    return futureDatetime.toISOString();
}

/**
 * Get ISO String one hour in the future
 * @returns - formatted string
 */
export function get1HourExpirationIsoDate() {
    const futureDatetime: Date = new Date(
        new Date().getTime() + 60 * 60 * 1000
    ); // Add 1 hour in milliseconds
    return futureDatetime.toISOString();
}

export function getUniqueIdentifierToLog(iUser: IUser): LoggingIdentifier {
    // const discordTag = iUser?.discordProvider?.name;
    // if (discordTag) {
    //     return { identifier: discordTag, type: IdentifierType.discordTag };
    // }

    // if (!iUser?.walletProvider) {
    //     return { identifier: iUser._id!.toString(), type: IdentifierType.id };
    // }
    // const walletAddress = iUser?.walletProvider.address;
    // if (walletAddress) {
    //     return {
    //         identifier: walletAddress,
    //         type: IdentifierType.walletProvider?.address,
    //     };
    // }
    // return {
    //     identifier: iUser._id!.toString(),
    //     type: IdentifierType.id,
    // };

    //@audit - short circuit until discord tags is impl.
    return {
        identifier: iUser?.preferences?.displayName || "user-name-null",
        type: IdentifierType.id,
    };
}

/**
 * Convert hexcode to rgba
 * @param hex - hex code of color
 * @param opacity - amnount of opacity to add
 * @returns string i.e. "rgba(244,0,0, 0.4)"
 */
export function hexToRgba(hex: string, opacity: number): string {
    // Remove the # symbol if it's present
    hex = hex.replace(/^#/, "");

    // Parse the hex value into red, green, and blue components
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    // Create the RGBA color string with the specified opacity
    const rgba = `rgba(${r}, ${g}, ${b}, ${opacity})`;

    return rgba;
}

/**
 * Truncates a string to a specified length and adds an ellipsis (...) if the string was truncated.
 *
 * @param {string} str - The string to truncate.
 * @param {number} num - The maximum length of the truncated string.
 * @returns {string} The truncated string, or the original string if it's shorter than the maximum length.
 */
export function truncateString(str: string, num: number) {
    if (!str) return "";
    if (str.length <= num) {
        return str;
    }
    return str.slice(0, num) + "...";
}

/**
 * Converts milliseconds to seconds and rounds to the nearest whole number.
 * @param {number} milliseconds - The time in milliseconds.
 * @returns {number} The time in seconds, rounded to the nearest whole number.
 */
export function convertMillisecondsToSeconds(milliseconds: number): number {
    return Math.round(milliseconds / 1000);
}

/**
 * Convert .NET timestamp (tick) to js unix timestamp
 * @param timestamp - .NET tick timestamp
 * @returns timestamp
 */
export function convertNETBackendTimestampToUnix(timestamp: number): number {
    const epochTicks = 621355968000000000; // Ticks at Unix epoch (1970-01-01)
    const ticksPerMillisecond = 10000;
    const jsTimestamp = Math.floor(
        (timestamp - epochTicks) / ticksPerMillisecond
    );

    return jsTimestamp;
}

/**
 * Get offset between two timestamp
 * @param {number} timestamp - unix timestamp
 * @param {number} otherTimestamp - unix timestamp
 * @returns unix timestamp offset
 */
export function getUnixTimestampOffset(
    timestamp: number,
    otherTimestamp: number
): number {
    return Math.floor(Math.abs(timestamp - otherTimestamp));
}

export const sortComparable = (
    thisObject: ISeries | IEvent | IStage,
    otherObject: ISeries | IEvent | IStage
) => {
    return (
        new Date(thisObject.startDate).getTime() -
        new Date(otherObject.startDate).getTime()
    );
};

// Utility function to format numbers without trailing zeros
export const removeTrailingZeros = (num: number): string => {
    // Convert to string and remove trailing zeros after decimal
    return Number(num)
        .toFixed(1)
        .toString()
        .replace(/\.?0+$/, "");
};

export const calculateTotalCredits = (credits: number, totalBonus: number) => {
    const bonusMultiplier = (100 + totalBonus) / 100;
    return Math.round(credits * bonusMultiplier);
};

export const sum = (numbers: number[]) =>
    numbers.reduce((acc, num) => acc + num, 0);

/**
 * Ceonvert regular token value by dividing by 10^18
 * @param wei - the amount in Wei to convert to the main token unit
 * @returns The converted value as a number representing the ceiling alue in the main token unit
 */
export const weiToToken = (wei: bigint) => {
    const token = ethers.utils.formatUnits(wei, 18);
    return Number(token);
};

export const convertTokenUnit = (wei: bigint) => {
    let token = weiToToken(wei);
    token = Math.floor(token * 100);
    const result = token / 100;
    return result;
};

export const formatNumber = (num: number) => {
    const suffixes = ["", "k", "M", "B", "T"];
    let value = num;
    let i = 0;

    while (value >= 1000 && i < suffixes.length - 1) {
        value /= 1000;
        i++;
    }

    if (value == null)
        return 0;

    return value.toFixed(1) + suffixes[i];
};

export const formatTimeToMinutesSeconds = (seconds: number | undefined): string => {
    if (!seconds && seconds !== 0) return "";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export const darkenHexColor = (hex: string, percent: number): string => {
    // Remove "#" if present
    hex = hex.replace(/^#/, '');

    // Convert hex to RGB
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // Darken each channel by the given percentage
    r = Math.max(0, Math.floor(r * (1 - percent / 100)));
    g = Math.max(0, Math.floor(g * (1 - percent / 100)));
    b = Math.max(0, Math.floor(b * (1 - percent / 100)));

    // Convert back to hex and return
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export const retry = async <T>(
    fn: () => Promise<T>,
    retries = 4,
    delay = 100
): Promise<T> => {
    try {
        return await fn();
    } catch (error) {
        if (retries > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            return retry(fn, retries - 1, delay * 2); // Exponential backoff
        }
        throw error;
    }
};

export const getProtocol = (req: NextApiRequest): "http" | "https" => {
  const xfProto = req.headers["x-forwarded-proto"];
  const proto =
    (Array.isArray(xfProto) ? xfProto[0] : xfProto)?.split(",")[0]?.trim();

  if (proto === "https" || proto === "http") {
    return proto;
  }

  // Local dev fallback (Node only, but no tls import)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((req.socket as any)?.encrypted) {
    return "https";
  }

  return "http";
}
