import { AppClient, createAppClient, viemConnector } from "@farcaster/auth-kit";
export let FARCASTER_APP_CLIENT: AppClient | null;
export function getFarcasterAppClient() {
    if (!FARCASTER_APP_CLIENT) {
        FARCASTER_APP_CLIENT = createAppClient({
            ethereum: viemConnector(),
        });
    }
    return FARCASTER_APP_CLIENT;
}
