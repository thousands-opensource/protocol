import { IUser, WildcardApiResponse, IExternalStream } from "@repo/interfaces";
import { fetchExternalStreams } from "@repo/schemas";

export async function handleFetchExternalStreams(): Promise<WildcardApiResponse> {
    const externalStreams: IExternalStream[] = await fetchExternalStreams({
        // $or: [{ completedOn: { $exists: false } }, { completedOn: null }],
    });
    console.log(`Fetched all external streams: ${externalStreams ?? []}`);

    return {
        success: true,
        data: externalStreams,
    };
}
