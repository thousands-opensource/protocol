import connectToDb from "@/db/connectToDb";
import { injectable } from "inversify";
import { IRecognitionProgram } from "@repo/interfaces";
import IRecognitionProgramRepository from "@/repositories/interfaces/IRecognitionProgramRepository";
import { recognitionProgramModel } from "@repo/schemas";

@injectable()
export default class recognitionProgramRepository
    implements IRecognitionProgramRepository
{
    async getRecognitionPrograms(): Promise<IRecognitionProgram[] | null> {
        await connectToDb();
        const findAllFilter = {};
        return recognitionProgramModel.find(findAllFilter).lean();
    }

    async getRecognitionProgram(
        recognitionProgramId: string
    ): Promise<IRecognitionProgram | null> {
        await connectToDb();
        return recognitionProgramModel.findById(recognitionProgramId).lean();
    }

    async getRecognitionProgramsInfo(): Promise<IRecognitionProgram[] | null> {
        await connectToDb();
        const findAllFilter = {};
        return recognitionProgramModel
            .find(findAllFilter, { _id: 1, name: 1 })
            .lean();
    }
}
