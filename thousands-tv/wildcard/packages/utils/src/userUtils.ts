import { IUser } from "@repo/interfaces";

export function userIdentifier(user: IUser): string {
    return (
        user.discordProvider?.discordTag ||
        user.preferences?.displayName ||
        String(user._id)
    );
}
