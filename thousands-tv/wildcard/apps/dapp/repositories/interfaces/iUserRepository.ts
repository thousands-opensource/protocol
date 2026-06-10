import { IUser } from "@repo/interfaces";
import { ClientSession } from "mongoose";

export default interface IUserRepository {
    findUserIdFromUserName(userName: string): Promise<IUser | null>;

    findUserById(userId: string): Promise<IUser | null>;

    addRoleToUser(userId: string, roleId: string): Promise<boolean>;

    removeRoleFromUser(userId: string, roleId: string): Promise<boolean>;

    getUsersFromBeamableIds(ids: string[]): Promise<IUser[]>;

    setCompetitorStripeId(
        userId: string,
        competitorStripeId: string
    ): Promise<boolean>;

    updateThousandXp(
        userId: string,
        thousandsXpToAdd: number,
        session?: ClientSession
    ): Promise<boolean>;

    incrementDraftPicksEarned(
        userId: string,
        draftPicksToAdd: number,
        session?: ClientSession
    ): Promise<boolean>;

    incrementDraftPicksConsumed(
        userId: string,
        draftPicksToAdd: number,
        session?: ClientSession
    ): Promise<boolean>;

    updatePayoutMethod(
        userId: string,
        payoutMethod: "USD" | "USDC"
    ): Promise<boolean>;
}
