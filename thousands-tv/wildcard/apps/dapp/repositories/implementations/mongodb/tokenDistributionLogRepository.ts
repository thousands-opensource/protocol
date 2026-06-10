import { injectable } from "inversify";
import connectToDb from "@/db/connectToDb";
import {
    TokenDistributionLogDoc,
    tokenDistributionLogModel,
} from "@repo/schemas";
import ITokenDistributionLogRepository from "@/repositories/interfaces/ITokenDistributionLogRepository";

@injectable()
export class TokenDistributionLogRepository
    implements ITokenDistributionLogRepository
{
    async createTokenDistributionLog(
        vendorEventId: string,
        logs: string
    ): Promise<TokenDistributionLogDoc | null> {
        try {
            await connectToDb();
            const newLog = await tokenDistributionLogModel.create({
                vendorEventId,
                logs,
            });
            return newLog;
        } catch (error) {
            console.error("Error creating token distribution log:", error);
            return null;
        }
    }
}
