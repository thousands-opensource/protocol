import { UserRallyPredictionDoc } from "@repo/schemas";

export default interface IUserRallyPredictionRepository {
    addUserRallyPrediction(
        userId: string,
        rallyPredictionId: string,
        amount: number,
        price: number,
        forOrAgainst: boolean,
        questionText: string,
        selectedOptionText: string,
        selectedOptionTextColor: string
    ): Promise<UserRallyPredictionDoc | null>;

    getUserRallyPredictionsByUserId(
        userId: string
    ): Promise<UserRallyPredictionDoc[]>;

    getUserRallyPredictionsByRallyPredictionId(
        rallyPredictionId: string
    ): Promise<UserRallyPredictionDoc[]>;

    getUserRallyPredictionsByUserIdAndRallyPredictionId(
        userId: string,
        rallyPredictionId: string
    ): Promise<UserRallyPredictionDoc[]>;
}
