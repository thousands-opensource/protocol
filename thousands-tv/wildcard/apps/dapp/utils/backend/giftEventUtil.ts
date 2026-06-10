import { IUser, WildcardApiResponse, IGiftEvent } from "@repo/interfaces";
import { completeGiftEvent, fetchGiftEvents } from "@repo/schemas";
import { NextApiRequest } from "next";

export async function handleFetchGiftEvents(): Promise<WildcardApiResponse> {
    const giftEvents: IGiftEvent[] = await fetchGiftEvents({
        // $or: [{ completedOn: { $exists: false } }, { completedOn: null }],
    });
    console.log(`Fetched all gift events: ${giftEvents ?? []}`);

    return {
        success: true,
        data: giftEvents,
    };
}

export async function handleCompleteGiftEvent(
    req: NextApiRequest
): Promise<WildcardApiResponse> {
    const { giftEventId }: { giftEventId: string } = req.body;
    console.log(`Completing gift event ${giftEventId}`);

    if (!giftEventId) {
        return { success: false, err: "Invalid body" };
    }

    const filter = { _id: giftEventId };
    const update = { completedOn: new Date() };
    await completeGiftEvent(filter, update);
    console.log(`Completed gift event ${giftEventId}`);

    return await handleFetchGiftEvents();
}
