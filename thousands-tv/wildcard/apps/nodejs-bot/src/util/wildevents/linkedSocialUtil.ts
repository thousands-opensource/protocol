import { LINKED_SOCIAL_WILDEVENT_CONTRACT } from "@src/contracts/wildevents/types/LinkedSocialWildevent";
import { LinkedSocialWildevent, Wildevent } from "@src/types";

export async function decodeLinkedSocialWildevents(
    wildevents: Wildevent[]
): Promise<string> {
    let msg = "";
    await Promise.all(
        wildevents.map(async (wildevent) => {
            const eventId = wildevent.wildeventId;
            const attestor = wildevent.attestorWildfileId;
            const wildfileIds = wildevent.wildfileIds;
            const decodedPlatform =
                await LINKED_SOCIAL_WILDEVENT_CONTRACT.decode(wildevent.data);
            const decodedLinkedSocialEvent: LinkedSocialWildevent = {
                platform: decodedPlatform,
            };

            msg += `\tWildevent Id: ***${eventId}***
\tAttestor Wildfile Id: ***${attestor}***
\tWildfile Id: ***[ ${wildfileIds.join(", ")} ]***
\tPlatform: ***${decodedLinkedSocialEvent.platform}***
\n`;
        })
    );

    return msg;
}
