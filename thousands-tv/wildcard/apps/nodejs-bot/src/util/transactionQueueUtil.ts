import { PostedWildevent } from "@repo/interfaces";

export function getIndexesOfCommonWildfileIds(
    wildfileIds: number[],
    existingWildevents: PostedWildevent[]
): number[] {
    if (!existingWildevents || existingWildevents.length === 0) {
        return [];
    }

    // Create a set of all wildfileIds from the existing attendance events for quick lookup
    const eventWildfileIdSet = new Set<number>();
    existingWildevents.forEach((event) => {
        event.wildfileIds.forEach((id) => {
            eventWildfileIdSet.add(id);
        });
    });

    let commonWildfileIndexes: number[] = [];

    // Determine the indexes of common IDs by checking against the set
    wildfileIds.forEach((id, index) => {
        if (eventWildfileIdSet.has(id)) {
            commonWildfileIndexes.push(index);
        }
    });

    return commonWildfileIndexes;
}
