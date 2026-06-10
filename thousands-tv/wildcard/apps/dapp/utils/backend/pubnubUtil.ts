import Pubnub, { PubnubConfig } from "pubnub";
import {
    getPubnubPublishKey,
    getPubnubSubscribeKey,
} from "../environmentUtilWCA";
import { Chat } from "@pubnub/chat";
/**
 * Instantiate a pubnub instance
 * @param userId - a uuid
 * @param secretKey - pubnub secret key
 * @returns pubnub instance
 */
export const getPubnubInstance = (userId: string, secretKey?: string) => {
    // @todo revisit due to public envs
    let pubnubConfig: PubnubConfig = {
        publishKey: getPubnubPublishKey(),
        subscribeKey: getPubnubSubscribeKey(),
        userId: userId,
    };

    if (secretKey) {
        pubnubConfig.secretKey = secretKey;
    }

    return new Pubnub(pubnubConfig);
};

export const getPubnubChatInstance = (userId: string, token: string) => {
   return Chat.init({
        publishKey: getPubnubPublishKey(),
        subscribeKey: getPubnubSubscribeKey(),
        userId: userId,
        authKey: token,
    });
};
