import { Types } from "mongoose";

// inline with Thirdweb BuyWithCryptoTransaction
export enum CreditTransactionStatus {
    COMPLETED = "COMPLETED",
    PENDING = "PENDING",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED",
    NONE = "NONE",
}

export enum CreditTransactionType {
    CREDIT = "credit",
    BOOST = "boost",
    ADMIN_ADJUSTMENT = "admin_adjustment",
    SKYBOX_PURCHASE = "skybox_purchase",
}

export interface ICreditTransaction {
    userId: Types.ObjectId; // User's unique identifier
    transactionId: string; // Unique transaction identifier for the credits transaction (for mongo reference)
    status: CreditTransactionStatus; // Status of the credit transaction
    amount: number; // Amount of money paid (in original currency)
    currency: string; // Currency used for the payment (e.g., USD, ETH)
    paymentGatewayTransactionId?: string; // Unique transaction identifier for this credit addition (from the payment gateway)
    paymentMethod?: string; // Payment method used (e.g., 'credit card', 'crypto')
    paymentGateway?: string; // Payment gateway used (e.g., "Thirdweb", 'Stripe', 'Coinbase')
    refundedAmount?: number; // Amount refunded (if applicable)
    creditType: CreditTransactionType; // Type of credit transaction
    identityId?: Types.ObjectId; // Identity's unique identifier

    adjustmentReason?: string; // Required for admin adjustments
    adjustedBy?: Types.ObjectId; // Admin user who made the adjustment

    stageId?: string;
    segment?: number;
    skyboxTier?: number;

    _id?: Types.ObjectId;
    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
