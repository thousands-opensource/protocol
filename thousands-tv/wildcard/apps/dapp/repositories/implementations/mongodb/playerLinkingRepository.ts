import { injectable } from "inversify";
import IPlayerLinkingRepository from "@/repositories/interfaces/IPlayerLinkingRepository";
import {
    ThousandsLinkCodeDoc,
    thousandsLinkCodeModel,
} from "@repo/schemas";

@injectable()
export default class playerLinkingRepository
    implements IPlayerLinkingRepository
{
    async getPlayerByLinkCode(
        code: string
    ): Promise<ThousandsLinkCodeDoc | null> {
        try {
            const now = new Date();
            return await thousandsLinkCodeModel
                .findOne({
                    c: code,
                    e: { $gte: now },
                    u: false,
                })
                .sort({ gt: -1 })
                .exec();
        } catch (error) {
            console.error(
                `playerLinkingRepository.getPlayerByLinkCode failed for code: ${code}`,
                error
            );
            return null;
        }
    }
}
