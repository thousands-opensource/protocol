import { Document, Schema, model, Model, models, Types } from "mongoose";
import {
    IAccessCode,
    MONGO_REQUIRED_STRING,
    TIMESTAMPS,
    AccessCodeType,
    TicketTierType,
    ACCESS_CODES_TABLE_NAME,
    UserRole,
    AccessCodeIntent,
} from "@repo/interfaces";

const accessCodeSchema = new Schema<IAccessCode>({
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: "Organization",
        default: null,
    },
    accessCode: MONGO_REQUIRED_STRING,
    isClaimed: { type: Boolean, default: false },
    claimedUsers: [
        {
            claimedCodeEventId: {
                type: Schema.Types.ObjectId,
                ref: "Event",
                default: null,
            },
            claimedBy: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        },
    ],
    seriesId: {
        type: Schema.Types.ObjectId,
        ref: "Season",
        default: null,
    },
    codeType: {
        type: String,
        enum: Object.values(AccessCodeType),
        required: true,
    },
    maxQuantity: {
        type: Number,
        required: true,
    },

    // Intent field to control the purpose of the access code
    intent: {
        type: String,
        enum: Object.values(AccessCodeIntent), // Use the AccessCodeIntent enum
        required: true,
    },

    // Optional fields that depend on the intent (these fields are only required based on the intent)
    // @dev - function is used to ensure the fields are only required based on the intent
    tier: {
        type: String,
        enum: Object.values(TicketTierType),
        required: function () {
            return this.intent === AccessCodeIntent.TICKET;
        },
    },
    accessRoles: [
        {
            type: String,
            enum: Object.values(UserRole),
            required: function () {
                return this.intent === AccessCodeIntent.ACCESS_ROLE;
            },
        },
    ],
    partnerId: {
        type: Schema.Types.ObjectId,
        ref: "Partner",
        default: null,
    },
});

accessCodeSchema.set(TIMESTAMPS, true);

export const accessCodeModel =
    (models[ACCESS_CODES_TABLE_NAME] as Model<IAccessCode, {}, {}, {}, any>) ||
    model<IAccessCode>(ACCESS_CODES_TABLE_NAME, accessCodeSchema);

export type AccessCodeDoc = Document<unknown, any, IAccessCode> &
    IAccessCode &
    Required<{ _id: Types.ObjectId }>;
