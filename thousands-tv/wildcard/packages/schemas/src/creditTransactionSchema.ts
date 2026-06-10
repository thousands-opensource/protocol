import {
    CreditTransactionStatus,
    CreditTransactionType,
    ICreditTransaction,
} from "@repo/interfaces";
import {
    Document,
    Schema,
    model,
    Model,
    models,
    Types,
    InferSchemaType,
} from "mongoose";

export const CREDIT_TRANSACTIONS_TABLE_NAME = "credit-transactions";

const creditTransactionsSchema = new Schema<ICreditTransaction>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        transactionId: {
            type: String,
            required: true,
            unique: true,
        },
        status: {
            type: String,
            enum: Object.values(CreditTransactionStatus),
            default: CreditTransactionStatus.PENDING,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            required: true,
        },
        paymentGatewayTransactionId: {
            type: String,
        },
        paymentMethod: {
            type: String,
            required: true,
        },
        paymentGateway: {
            type: String,
        },
        refundedAmount: {
            type: Number,
            default: 0,
        },
        creditType: {
            type: String,
            required: true,
            enum: Object.values(CreditTransactionType),
        },
        identityId: {
            type: Schema.Types.ObjectId,
            ref: "Identity",
        },
        adjustmentReason: {
            type: String,
        },
        adjustedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        stageId: String,
        segment: Number,
        skyboxTier: Number,
    },
    {
        timestamps: true, // Automatically handles createdAt and updatedAt
    }
);

// Due to a Next.js issue with MongoDB, we need to first check and return the model if it has already been created
// see https://stackoverflow.com/questions/62440264/mongoose-nextjs-model-is-not-defined-cannot-overwrite-model-once-compiled for more details
export const creditTransactionsModel =
    (models[CREDIT_TRANSACTIONS_TABLE_NAME] as Model<any, {}, {}, {}, any>) ||
    model(CREDIT_TRANSACTIONS_TABLE_NAME, creditTransactionsSchema);

export type CreditTransactionDoc = Document<unknown, any, any> & {
    _id: Types.ObjectId;
} & {
    userId: Types.ObjectId;
    transactionId: string;
    status: CreditTransactionStatus;
    amount: number;
    currency: string;
    paymentGatewayTransactionId?: string;
    paymentMethod: string;
    paymentGateway?: string;
    creditType: CreditTransactionType;
    refundedAmount?: number;
    identityId?: Types.ObjectId;
    adjustmentReason?: string;
    adjustedBy?: Types.ObjectId;
    stageId?: string;
    segment?: number;
    skyboxTier?: number;
};

export type CreditTransactionInsert = InferSchemaType<
    typeof creditTransactionsSchema
>;
