import { IdentityDoc } from "@repo/schemas";
import { IIdentity } from "@repo/interfaces";

export default interface IIdentityRepository {
    getIdentity(identityId: string): Promise<IdentityDoc | null>;

    getIdentities(): Promise<IdentityDoc[]>;

    addIdentity(newIdentity: IIdentity): Promise<IdentityDoc>;

    updateIdentity(updatedIdentity: IIdentity): Promise<IdentityDoc>;

    getIdentitiesOnStage(stageId: string): Promise<IdentityDoc[]>;

    getIdentitiesForServer(serverId: string): Promise<IdentityDoc[]>;
}