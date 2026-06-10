import { ThousandsLinkCodeDoc } from "@repo/schemas";

export default interface IPlayerLinkingRepository {
    getPlayerByLinkCode(code: string): Promise<ThousandsLinkCodeDoc | null>;
}
