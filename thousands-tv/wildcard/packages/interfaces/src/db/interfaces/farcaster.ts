export enum FarcasterStatusEnum {
	NO_DB_RECORD = "No Database Record",
	ALREADY_MINTED = "User Already Minted",
	OUT_OF_TOKENS = "Out of Tokens",
	SUCCESSFUL_TOKEN_TRANSFER = "Successfully Transferred Token",
	ERROR = "error",
}

export interface FrameImageObj {
	frame: string;
	image: string;
}

export interface FarcasterHasMintedInterface {
	hasMinted: boolean;
	tokenId: number;
}

export interface FarcasterMintInterface {
	farcasterResp: FarcasterStatusEnum;
	tokenId: number;
}
