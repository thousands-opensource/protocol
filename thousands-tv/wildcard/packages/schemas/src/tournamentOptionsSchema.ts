import {
    Document,
    Schema,
    model,
    Model,
    models,
    Types,
} from "mongoose";
import {
    ITournamentOptions,
    TOURNAMENT_OPTIONS_COLLECTION,
    TOURNAMENT_PAYOUT_SCHEDULE_COLLECTION,
    TIMESTAMPS,
} from "@repo/interfaces";

const tournamentOptionsSchema = new Schema<ITournamentOptions>({
    tid: { type: String, required: true, unique: true },
    payoutSchedule: {
        type: Schema.Types.ObjectId,
        ref: TOURNAMENT_PAYOUT_SCHEDULE_COLLECTION,
        required: true,
    },
});

tournamentOptionsSchema.set(TIMESTAMPS, true);

export const tournamentOptionsModel =
    (models[TOURNAMENT_OPTIONS_COLLECTION] as Model<
        ITournamentOptions,
        {},
        {},
        {},
        any
    >) ||
    model<ITournamentOptions>(
        TOURNAMENT_OPTIONS_COLLECTION,
        tournamentOptionsSchema
    );

export type TournamentOptionsDoc = Document<
    unknown,
    any,
    ITournamentOptions
> &
    ITournamentOptions &
    Required<{ _id: Types.ObjectId }>;
