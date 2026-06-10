import {
    IvschatClient,
    Ivschat,
    CreateChatTokenCommandInput,
    CreateChatTokenCommandOutput,
    CreateRoomCommand,
    CreateRoomCommandInput,
    CreateRoomCommandOutput,
    ChatTokenCapability,
} from "@aws-sdk/client-ivschat";
import { ChatToken } from "amazon-ivs-chat-messaging";

export interface ICreateChatTokenResponse {
    message: string;
    error: string;
    chatToken: CreateChatTokenCommandOutput | null;
}

export const createChatToken = async (
    roomIdentifier: string,
    userDisplayName: string,
    userId: string,
    isAdmin: boolean
): Promise<ICreateChatTokenResponse> => {
    let capabilities: ChatTokenCapability[] = [
        ChatTokenCapability.SEND_MESSAGE,
        ChatTokenCapability.DISCONNECT_USER,
    ];

    if (isAdmin) {
        capabilities = [
            ChatTokenCapability.SEND_MESSAGE,
            ChatTokenCapability.DISCONNECT_USER,
            ChatTokenCapability.DELETE_MESSAGE,
        ];
    }

    try {
        const params: CreateChatTokenCommandInput = {
            attributes: {
                displayName: userDisplayName,
            },
            capabilities: capabilities,
            roomIdentifier: roomIdentifier, //"arn:aws:ivschat:us-west-2:211125321202:room/5S0qEodMopT1",
            userId: userId,
        };
        let chatToken: CreateChatTokenCommandOutput =
            await createChatTokenFromCreateChatTokenCommandInput(params);

        return {
            message: "",
            error: "",
            chatToken: chatToken,
        };
    } catch (error: any) {
        return {
            message: "Error creating chat token",
            error: error.message,
            chatToken: null,
        };
    }
};

async function createChatTokenFromCreateChatTokenCommandInput(
    params: CreateChatTokenCommandInput
) {
    const ivs = new Ivschat();
    const result = await ivs.createChatToken(params);
    //console.log("New token created", result.token);

    return result;
}

/**
 *
 * @param token - chat token
 * @param tokenExpirationTime - chat token expiration time
 * @param sessionExpirationTime - session expiration time
 * @returns
 */
export const getTokenProvider = async (
    token: string,
    tokenExpirationTime?: Date,
    sessionExpirationTime?: Date
): Promise<ChatToken> => {
    const chatTokenProvider: ChatToken = {
        token,
        tokenExpirationTime,
        sessionExpirationTime,
    };

    return chatTokenProvider;
};

export interface ICreateChatRoomResponse {
    message: string;
    error: string;
    output: CreateRoomCommandOutput | null;
}

export const createChatRoom = async (
    streamId: string
): Promise<ICreateChatRoomResponse> => {
    try {
        const chatRoomName = "chat-room-" + streamId;
        const ivsChatClient = new IvschatClient();
        const createRoomRequest: CreateRoomCommandInput = {
            // CreateRoomRequest
            name: chatRoomName,
            maximumMessageRatePerSecond: 100,
            maximumMessageLength: 500,
            messageReviewHandler: {
                // MessageReviewHandler
            },
            tags: {
                // Tags
            },
            loggingConfigurationIdentifiers: [
                // LoggingConfigurationIdentifierList
            ],
        };
        const createRoomCommand = new CreateRoomCommand(createRoomRequest);
        const createRoomResponse: CreateRoomCommandOutput =
            await ivsChatClient.send(createRoomCommand);

        return {
            message: "",
            error: "",
            output: createRoomResponse,
        };
    } catch (error: any) {
        return {
            message: "Error creating chat room",
            error: error.message,
            output: null,
        };
    }
};
