import { IAccessCode } from "@repo/interfaces";

export default interface IAccessCodeRepository {
    createAccessCode(accessCode: IAccessCode): Promise<IAccessCode | null>;

    findAccessCodeByCode(accessCode: string): Promise<IAccessCode | null>;

    claimAccessCode(
        accessCode: string,
        userId: string
    ): Promise<IAccessCode | null>;

    findValidAccessCodesByUserIdAndseriesId(
        userId: string,
        seriesId: string
    ): Promise<IAccessCode[]>;

    getAccessCodeRoles(accessCode: string): Promise<string[] | null>;

    hasClaimedClaimedAccessCodeByUserId(
        userId: string,
        accessCode: string
    ): Promise<boolean>;
}
