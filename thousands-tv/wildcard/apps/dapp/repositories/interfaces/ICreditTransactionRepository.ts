import { CreditTransactionDoc } from "@repo/schemas";
import { CreditTransactionStatus, CreditTransactionType, ICreditTransaction } from "@repo/interfaces";

export default interface ICreditTransactionRepository {
    createCreditTransaction(
        userId: string,
        transactionId: string,
        amount: number,
        currency: string,
        paymentMethod: string,
        paymentGateway: string
    ): Promise<CreditTransactionDoc | null>;

    // Add credits to a user and store the transaction in the database
    addCredits(
        userId: string,
        transactionId: string,
        amount: number
    ): Promise<boolean>;

    getCreditTransactionsByUserId(
        userId: string,
        creditType?: CreditTransactionType
    ): Promise<CreditTransactionDoc[]>;

    getCreditTransactionByTransactionId(
        transactionId: string
    ): Promise<CreditTransactionDoc | null>;

    updateCreditTransactionStatus(
        transactionId: string,
        status: CreditTransactionStatus
    ): Promise<CreditTransactionDoc | null>;

    createAdminAdjustment(
        userId: string,
        adminId: string,
        amount: number,
        reason: string,
    ): Promise<CreditTransactionDoc | null>;
}
