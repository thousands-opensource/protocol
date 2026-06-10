import { UserSponsoredEventDoc } from "@repo/schemas";

export default interface IUserSponsoredEventRepository {
    addUserSponsoredEvent(
        userSponsoredEvent: Partial<UserSponsoredEventDoc>
    ): Promise<UserSponsoredEventDoc | null>;

    getSponsoredEventsByUserId(
        userId: string
    ): Promise<UserSponsoredEventDoc[]>;

    getSponsoredEventsForUserId(
        userId: string
    ): Promise<UserSponsoredEventDoc[]>;
}
