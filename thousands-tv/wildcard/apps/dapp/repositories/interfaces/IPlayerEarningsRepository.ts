import { Types } from "mongoose";
import {
    PlayerEarningsTransactionDoc,
    PlayerEarningsDoc,
} from "@repo/schemas";

export default interface IPlayerEarningsRepository {
    addPlayerEarningsTransaction(
        gamerTag: string,
        type: string,
        amount: number,
        tournamentId: string
    ): Promise<PlayerEarningsTransactionDoc | null>;

    getPlayerEarningsTransactions(
        gamerTag: string
    ): Promise<PlayerEarningsTransactionDoc[]>;

    addOrUpdatePlayerEarnings(
        gamerTag: string,
        earnings: number
    ): Promise<PlayerEarningsDoc | null>;

    getPlayerEarnings(
        gamerTag: string
    ): Promise<PlayerEarningsDoc | null>;
}

