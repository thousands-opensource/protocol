import {
    Document,
    Schema,
    model,
    Model,
    models,
    Types,
    FilterQuery,
    UpdateWithAggregationPipeline,
    UpdateQuery,
    ClientSession,
} from "mongoose";
import {
    IStage,
    MONGO_REQUIRED_STRING,
    USERS,
    TIMESTAMPS,
    MONGO_REQUIRED_NUMBER,
    STAGES_TABLE_NAME,
    ISkybox,
} from "@repo/interfaces";

export const SKYBOX_TABLE_NAME = "skyboxes";

// Skybox Schema
export const skyboxSchema = new Schema<ISkybox>({
    stageId: {
        type: Schema.Types.ObjectId,
        ref: STAGES_TABLE_NAME,
    },
    ownerUserId: {
        type: Schema.Types.ObjectId,
        ref: USERS,
    },
    skyboxName: MONGO_REQUIRED_STRING,
    skyboxPrimaryColor: MONGO_REQUIRED_STRING,
    skyboxTier: MONGO_REQUIRED_NUMBER,
    skyboxLogoUrl: MONGO_REQUIRED_STRING,
    skyboxChannelMembers: [MONGO_REQUIRED_STRING],
});

skyboxSchema.set(TIMESTAMPS, true);

// Due to a nextJS issue with mongo, we need to first check and return the model if it has already been created
// see https://stackoverflow.com/questions/62440264/mongoose-nextjs-model-is-not-defined-cannot-overwrite-model-once-compiled for more details

export const skyboxesModel =
    (models[SKYBOX_TABLE_NAME] as Model<ISkybox, {}, {}, {}, any>) ||
    model<ISkybox>(SKYBOX_TABLE_NAME, skyboxSchema);

export type SkyboxDoc = Document<unknown, any, ISkybox> &
    IStage &
    Required<{ _id: Types.ObjectId }>;
