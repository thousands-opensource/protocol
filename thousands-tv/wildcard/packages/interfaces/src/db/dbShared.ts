// a wildevent that was posted to the chain
export interface PostedWildevent {
    wildeventId?: number;
    txnHash: string;
    wildfileIds: number[];
    time: Date;
}

export const MONGO_REQUIRED_STRING = {
    type: String,
    required: true,
};
export const MONGO_REQUIRED_NUMBER = {
    type: Number,
    required: true,
};
export const MONGO_REQUIRED_BOOLEAN = {
    type: Boolean,
    required: true,
};
export const MONGO_REQUIRED_DATE = {
    type: Date,
    required: true,
};
export const MONGO_POSTED_WILDEVENT = {
    wildeventId: Number,
    txnHash: String,
    wildfileIds: [Number],
    time: Date,
};

export const MONGO_GAS_PRICE = {
    maxFeePerGas: Number,
    maxPriorityFeePerGas: Number,
};

export const MONGO_TRANSACTION = {
    type: MONGO_REQUIRED_STRING,
    data: MONGO_REQUIRED_STRING,
    status: MONGO_REQUIRED_STRING,
    blockchainStatus: MONGO_REQUIRED_STRING,
    resultData: String,
    txnHash: String,
    gasPrice: [MONGO_GAS_PRICE],
    nonce: [Number],
    errMsg: String,
};

export const MONGO_LINKED_SOCIAL = {
    id: String,
    username: String,
    accessToken: String,
    refreshToken: String,
    accessTokenExpiresAt: Date,
    wildevent: MONGO_POSTED_WILDEVENT,
};

export const MONGO_PROFILE_PICTURE = {
    tokenId: String,
    name: String,
    imageUrl: String,
    contractAddress: String,
};

export const MONGO_LINKED_FARCASTER = {
    fid: String,
    username: String,
    message: String,
    signature: String,
    nonce: String,
    wildevent: MONGO_POSTED_WILDEVENT,
};

export const TIMESTAMPS = "timestamps";

export const MONGO_DB_DUPLICATE_KEY_CODE = 11000