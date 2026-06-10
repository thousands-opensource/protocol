import { BoostBalanceDoc } from "@repo/schemas";

export default interface IBoostBalanceRepository {
    getBalanceByUserId(userId: string): Promise<BoostBalanceDoc | null>;

    addBoostToBalance(
        userId: string,
        amount: number
    ): Promise<BoostBalanceDoc | null>;
}
