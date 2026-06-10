import { ISponsoredEvent } from "@repo/interfaces";

export const getActiveSponsoredEventId = (
    events: ISponsoredEvent[],
    now: number = Date.now()
) => {
    if (!Array.isArray(events) || events.length === 0) {
        return null;
    }

    const activeEvent = events
        .filter((event) => {
            const lockTime = new Date(event.sponsorLockTime).getTime();
            return Number.isFinite(lockTime) && lockTime > now;
        })
        .sort((a, b) => {
            const aTime = new Date(a.sponsorLockTime).getTime();
            const bTime = new Date(b.sponsorLockTime).getTime();
            return aTime - bTime;
        })[0];

    return activeEvent?._id?.toString() ?? null;
};
