import { injectable } from "inversify";
import { Types } from "mongoose";
import { IdentityDoc, identityModel, serverModel, stagesModel } from "@repo/schemas";
import { IIdentity } from "@repo/interfaces";
import IIdentityRepository from "../../interfaces/IIdentityRepository";

@injectable()
export default class IdentityRepository implements IIdentityRepository {
    async getIdentity(identityId: string): Promise<IdentityDoc | null> {
        try {
            if (identityId === "") {
                console.log("identityId can not be empty string!");
                return null;
            }
            const objectId = new Types.ObjectId(identityId);
            return await identityModel.findById(objectId);
        } catch (error) {
            console.error("Error in getIdentity:", error);
            throw error;
        }
    }

    async getIdentities(): Promise<IdentityDoc[]> {
        try {
            return await identityModel.find({});
        } catch (error) {
            console.error("Error in getIdentities:", error);
            throw error;
        }
    }

    async addIdentity(newIdentity: IIdentity): Promise<IdentityDoc> {
        try {
            const identity = new identityModel(newIdentity);
            return await identity.save();
        } catch (error) {
            console.error("Error in addIdentity:", error);
            throw error;
        }
    }

    async updateIdentity(updatedIdentity: IIdentity): Promise<IdentityDoc> {
        try {
            if (!updatedIdentity._id) {
                throw new Error("Identity _id is required for update");
            }

            const identity = await identityModel.findByIdAndUpdate(
                updatedIdentity._id,
                { $set: updatedIdentity },
                { new: true }
            );

            if (!identity) {
                throw new Error(`Identity with id ${updatedIdentity._id} not found`);
            }

            return identity;
        } catch (error) {
            console.error("Error in updateIdentity:", error);
            throw error;
        }
    }

    async getIdentitiesOnStage(stageId: string): Promise<IdentityDoc[]> {
        try {
            const stage = await stagesModel.findById(stageId, {"identities": 1}).populate("identities");

            return stage.identities;
        } catch (error) {
            console.error("Error in getIdentitiesOnStage:", error);
            throw error;
        }
    }

    async getIdentitiesForServer(serverId: string): Promise<IdentityDoc[]> {
        try {
            const server = await serverModel.findById(serverId, {"identities": 1}).populate("identities");

            return server.identities;
        } catch (error) {
            console.error("Error in getIdentitiesForServer:", error);
            throw error;
        }
    }
}
