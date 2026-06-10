import { CreditBalanceDoc } from "@repo/schemas";

export default interface ICreditBalanceRepository {
    getBalanceByUserId(userId: string): Promise<CreditBalanceDoc | null>;

    addCreditsToBalance(
        userId: string,
        amount: number
    ): Promise<CreditBalanceDoc | null>;

    subtractCreditsFromBalance(
        userId: string,
        amount: number
    ): Promise<CreditBalanceDoc | null>;
}
