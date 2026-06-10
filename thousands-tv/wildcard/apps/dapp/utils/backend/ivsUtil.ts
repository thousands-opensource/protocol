import {
    IvsClient,
    CreateChannelCommand,
    CreateChannelCommandInput,
    CreateChannelCommandOutput,
    ChannelLatencyMode,
} from "@aws-sdk/client-ivs";
import {
    IVSRealTimeClient,
    CreateStageCommand,
    CreateStageCommandInput,
    CreateStageCommandOutput,
} from "@aws-sdk/client-ivs-realtime";
import {
    createChatRoom,
    ICreateChatRoomResponse,
} from "@/utils/backend/ivsChatUtil";
import StreamRepository from "@/repositories/implementations/mongodb/streamRepository";
import { streamModel } from "@repo/schemas";
import { ChatApp, IStream } from "@repo/interfaces";

export interface ICreateStream {
    message: string;
    error: string;
    stream: IStream | null;
}

export const createStream = async (
    serverId: string,
    stageId: string,
    streamName: string,
    streamDescription: string,
    chatApp: ChatApp
): Promise<ICreateStream> => {
    try {
        //Create stream in database
        const streamRepository = new StreamRepository();

        let model = new streamModel();

        model = {
            vendorEventId: null,
            name: streamName,
            description: streamDescription,
            status: "ACTIVE",
            stageId,
            serverId,
            chatApp,
        };

        let newStream = await streamRepository.createStream(model);

        if (!newStream) {
            return {
                message: "Error creating stream",
                error: "Error creating the stream in the db",
                stream: null,
            };
        }

        const createStageResponse: ICreateStageResponse = await createStage(
            newStream._id.toString()
        );

        console.log("stage: ", createStageResponse);

        const createChannelResponse: ICreateChannelResponse =
            await createChannel(newStream._id.toString());

        const createRoomResponse: ICreateChatRoomResponse =
            await createChatRoom(newStream._id.toString());

        newStream.stageArn = createStageResponse.output?.stage?.arn;
        newStream.channelArn = createChannelResponse.output?.channel?.arn;
        newStream.channelPlaybackUrl =
            createChannelResponse.output?.channel?.playbackUrl;
        newStream.chatRoomArn = createRoomResponse.output?.arn;
        newStream.cameraOperatorParticipantToken = createStageResponse?.output
            ?.participantTokens
            ? createStageResponse?.output?.participantTokens[0]?.token
            : "";
        newStream.streamKey =
            createChannelResponse.output?.streamKey?.value ?? "";
        newStream.ingestEndpoint =
            createChannelResponse.output?.channel?.ingestEndpoint ?? "";

        //createStageResponse.output?.participantTokens[0]?.token;
        await streamRepository.updateEntireStream(newStream);

        const stream = await streamRepository.findStreamById(
            newStream._id.toString()
        );

        console.log("newStream: ", stream);

        return {
            message: "",
            error: "",
            stream: stream,
        };
    } catch (error: any) {
        return {
            message: "Error creating stream",
            error: error.message,
            stream: null,
        };
    }
};

export interface ICreateStageResponse {
    message: string;
    error: string;
    output: CreateStageCommandOutput | null;
}

export const createStage = async (
    streamId: string
): Promise<ICreateStageResponse> => {
    try {
        const newStageName = "stage-" + streamId;
        const client = new IVSRealTimeClient();
        const input = {
            // CreateStageRequest
            name: newStageName,
            participantTokenConfigurations: [
                // ParticipantTokenConfigurations
                {
                    // ParticipantTokenConfiguration
                    duration: 720,
                    userId: "123456",
                    attributes: {
                        // ParticipantTokenAttributes
                        "featured-slot-1": "true",
                    },
                    capabilities: [
                        // ParticipantTokenCapabilities
                        "PUBLISH",
                        "SUBSCRIBE",
                    ],
                },
            ],
            tags: {
                // Tags
            },
        } as CreateStageCommandInput;
        const createStagecommand = new CreateStageCommand(input);
        const createStage: CreateStageCommandOutput = await client.send(
            createStagecommand
        );

        return {
            message: "",
            error: "",
            output: createStage,
        };
    } catch (error: any) {
        return {
            message: "Error creating stage",
            error: error.message,
            output: null,
        };
    }
};

export interface ICreateChannelResponse {
    message: string;
    error: string;
    output: CreateChannelCommandOutput | null;
}

export const createChannel = async (
    streamId: string
): Promise<ICreateChannelResponse> => {
    try {
        const newChannelName = "channel-" + streamId;
        const ivsClient = new IvsClient();
        const createChannelRequest: CreateChannelCommandInput = {
            // CreateChannelRequest
            name: newChannelName,
            latencyMode: ChannelLatencyMode.LowLatency,
            type: "STANDARD",
            authorized: false,
            recordingConfigurationArn: undefined,
            tags: {
                // Tags
                //"<keys>": "STRING_VALUE",
            },
            insecureIngest: true || false,
            preset: undefined, //"HIGHER_BANDWIDTH_DELIVERY" || "CONSTRAINED_BANDWIDTH_DELIVERY",
            playbackRestrictionPolicyArn: undefined, //"STRING_VALUE",
        };
        const createChannelCommand = new CreateChannelCommand(
            createChannelRequest
        );
        const createChannelResponse: CreateChannelCommandOutput =
            await ivsClient.send(createChannelCommand);

        return {
            message: "",
            error: "",
            output: createChannelResponse,
        };
    } catch (error: any) {
        return {
            message: "Error creating stage",
            error: error.message,
            output: null,
        };
    }
};
