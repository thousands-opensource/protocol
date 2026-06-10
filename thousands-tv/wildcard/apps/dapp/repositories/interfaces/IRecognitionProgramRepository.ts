import { IRecognitionProgram } from "@repo/interfaces";

export default interface IRecognitionProgramRepository {
    getRecognitionPrograms(): Promise<IRecognitionProgram[] | null>;
    getRecognitionProgram(
        recognitionProgramId: string
    ): Promise<IRecognitionProgram | null>;
    getRecognitionProgramsInfo(): Promise<IRecognitionProgram[] | null>;
}
