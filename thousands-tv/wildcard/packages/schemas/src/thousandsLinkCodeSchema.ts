import mongoose, {
    Connection,
    Document,
    Model,
    Schema,
    Types,
} from "mongoose";
import {
    IThousandsLinkCode,
    MONGO_REQUIRED_BOOLEAN,
    MONGO_REQUIRED_DATE,
    MONGO_REQUIRED_NUMBER,
    MONGO_REQUIRED_STRING,
    TIMESTAMPS,
} from "@repo/interfaces";

export const THOUSANDS_LINK_CODES_TABLE_NAME = "thousands_link_codes";
const DEFAULT_WILDCARD_GAME_DB_NAME = "1676368290596864DE_1676368290596867_PurchaseStorage";

const thousandsLinkCodeSchema = new Schema<IThousandsLinkCode>({
    c: MONGO_REQUIRED_STRING,
    gt: MONGO_REQUIRED_NUMBER,
    e: MONGO_REQUIRED_DATE,
    u: MONGO_REQUIRED_BOOLEAN,
    a: MONGO_REQUIRED_NUMBER,
});

thousandsLinkCodeSchema.set(TIMESTAMPS, true);

declare global {
    // eslint-disable-next-line no-var
    var thousandsLinkCodeConnection: Connection | undefined;
}

const buildWildcardGameConnectionUri = (): {
    uri: string;
    dbName: string;
} => {
    const explicitUri = process.env.WILDCARD_GAME_MONGODB_URI;
    const dbName =
        process.env.WILDCARD_GAME_MONGODB_NAME || DEFAULT_WILDCARD_GAME_DB_NAME;

    return { uri: explicitUri, dbName };
};

const getThousandsLinkCodeConnection = (): Connection => {
    if (globalThis.thousandsLinkCodeConnection) {
        return globalThis.thousandsLinkCodeConnection;
    }

    const { uri, dbName } = buildWildcardGameConnectionUri();
    const connection = mongoose.createConnection(uri, {
        dbName,
        maxPoolSize: 5,
    });

    connection.on("error", (err) => {
        console.error("Wildcard Game MongoDB connection error", err);
    });

    globalThis.thousandsLinkCodeConnection = connection;
    return connection;
};

const thousandsLinkCodeConnection = getThousandsLinkCodeConnection();

export const thousandsLinkCodeModel =
    (thousandsLinkCodeConnection.models[
        THOUSANDS_LINK_CODES_TABLE_NAME
    ] as Model<IThousandsLinkCode, {}, {}, {}, any>) ||
    thousandsLinkCodeConnection.model<IThousandsLinkCode>(
        THOUSANDS_LINK_CODES_TABLE_NAME,
        thousandsLinkCodeSchema
    );

export type ThousandsLinkCodeDoc = Document<unknown, any, IThousandsLinkCode> &
    IThousandsLinkCode &
    Required<{ _id: Types.ObjectId }>;
