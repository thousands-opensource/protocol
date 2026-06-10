import { AccountProviderType, IUser } from "@repo/interfaces";

export function getActivePfpUrl(user: IUser | null): string {
    if (!user) {
        return "";
    }

    let pfpUrl = "";
    // Check the active preference first
    switch (user.preferences?.activePfpImageUrl) {
        case AccountProviderType.TWITTER:
            pfpUrl = user.twitterProvider?.image;
            break;
        case AccountProviderType.DISCORD:
            pfpUrl = user.discordProvider?.image;
            break;
        case AccountProviderType.GOOGLE:
            pfpUrl = user.googleProvider?.image;
            break;
        case AccountProviderType.TWITCH:
            pfpUrl = user.twitchProvider?.image;
            break;
        case AccountProviderType.BEAMABLE:
            pfpUrl = user.beamableProvider?.image;
            break;
        case AccountProviderType.WALLET:
            const url = user.walletProvider?.pfp?.imageUrl;
            const separator = url.includes("?") ? "&" : "?";
            pfpUrl = `${url}${separator}v=${user.updatedAt ?? Date.now()}`;
            break;
        default:
            if (user.preferences?.defaultProfileImageUrl) {
                pfpUrl = user.preferences.defaultProfileImageUrl;
            }
            break;
    }

    // If a URL preference is set, return it
    if (pfpUrl) {
        return pfpUrl;
    }

    // Default fallback order: Wallet > Twitter > Discord > Google > Twitch > Beamable
    return (
        user.walletProvider?.pfp?.imageUrl ||
        user.twitterProvider?.image ||
        user.discordProvider?.image ||
        user.googleProvider?.image ||
        user.twitchProvider?.image ||
        user.beamableProvider?.image ||
        "" // Return an empty string if no URL is found
    );
}
