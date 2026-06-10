import { Schema, model, Document, models, Model } from "mongoose";

const TOKEN_DISTRIBUTION_LOG_NAME = "token-distribution-logs";

/**
 * Interface representing a token distribution log document.
 */
export interface ITokenDistributionLog {
    vendorEventId: string;
    logs: string;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Mongoose document type for ITokenDistributionLog.
 */
export type TokenDistributionLogDoc = Document & ITokenDistributionLog;

export const tokenDistributionLogSchema = new Schema<ITokenDistributionLog>(
    {
        vendorEventId: { type: String, required: true },
        logs: { type: String, required: true },
    },
    {
        timestamps: true,
    }
);

export const tokenDistributionLogModel =
    (models[TOKEN_DISTRIBUTION_LOG_NAME] as Model<
        ITokenDistributionLog,
        {},
        {},
        {},
        any
    >) ||
    model<ITokenDistributionLog>(
        TOKEN_DISTRIBUTION_LOG_NAME,
        tokenDistributionLogSchema
    );
