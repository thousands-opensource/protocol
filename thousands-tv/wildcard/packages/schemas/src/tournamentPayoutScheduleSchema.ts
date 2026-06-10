import {
    Document,
    Schema,
    model,
    Model,
    models,
    Types,
} from "mongoose";
import {
    ITournamentPayoutSchedule,
    ITournamentPayoutScheduleEntry,
    TOURNAMENT_PAYOUT_SCHEDULE_COLLECTION,
    TIMESTAMPS,
    MONGO_REQUIRED_STRING,
} from "@repo/interfaces";

const entrySchema = new Schema<ITournamentPayoutScheduleEntry>(
    {
        range: {
            type: [Number],
            required: true,
            validate: {
                validator: (value: number[]) =>
                    Array.isArray(value) && value.length === 2,
                message: "range must contain exactly two numbers",
            },
        },
        amountInCents: { type: Number, required: true },
    },
    { _id: false }
);

const tournamentPayoutScheduleSchema = new Schema<ITournamentPayoutSchedule>({
    payoutScheduleName: MONGO_REQUIRED_STRING,
    schedule: { type: [entrySchema], required: true },
});

tournamentPayoutScheduleSchema.set(TIMESTAMPS, true);

export const tournamentPayoutScheduleModel =
    (models[TOURNAMENT_PAYOUT_SCHEDULE_COLLECTION] as Model<
        ITournamentPayoutSchedule,
        {},
        {},
        {},
        any
    >) ||
    model<ITournamentPayoutSchedule>(
        TOURNAMENT_PAYOUT_SCHEDULE_COLLECTION,
        tournamentPayoutScheduleSchema
    );

export type TournamentPayoutScheduleDoc = Document<
    unknown,
    any,
    ITournamentPayoutSchedule
> &
    ITournamentPayoutSchedule &
    Required<{ _id: Types.ObjectId }>;
