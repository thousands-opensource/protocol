import { IUser } from "@repo/interfaces";
import { shorten } from "./util";
import { IdleEvent, ConsumableCommandAction } from "@/types";
import { WILDCARD_ACTIONS } from "@/constants/constants";

/**
 * Returns the display name of the user. Order precedent is: displayname, address, token, userId
 * @param user
 * @returns user's display name
 */
export function getUserDisplayName(user?: IUser | null): string {
    if (!user) return "anonymous";

    if (user?.preferences?.displayName) {
        return user?.preferences?.displayName;
    }

    const walletProvider = user?.walletProvider;

    if (walletProvider?.address) {
        return shorten(walletProvider?.address, { isAddress: true });
    }

    return user?._id?.toString() || "";
}

export const getIdleIcon = (event: IdleEvent) => {
    let wildcardAction = WILDCARD_ACTIONS.find(
        (element) => element.command === event.name
    );

    if (wildcardAction == undefined) return "";

    return wildcardAction.icon;
    /*
    switch (event.Name) {
        case ConsumableCommandAction.FIREWORKS:
            return "👨‍🚀";
        case ConsumableCommandAction.CHEER:
            return "🔥";
        case ConsumableCommandAction.CONFETTI:
            return "🚀";
        default:
            return "👀";
    }
    */
};

export function debounce(func: any, timeout = 300) {
    let timer: any;
    return (...args: any) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func(args);
        }, timeout);
    };
}
