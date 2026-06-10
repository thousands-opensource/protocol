import { IPro, IProAction } from "@repo/interfaces";
import { ProActionDoc, ProDoc } from "@repo/schemas";

export default interface IProRepository {
    createPro(pro: IPro): Promise<ProDoc | null>;
    getProByProId(proId: string): Promise<IPro | null>;
    getProsByUserId(userId: string): Promise<IPro[]>;
    getProActionsByUserId(userId: string): Promise<IProAction[]>;
    getProActionsByProId(proId: string): Promise<IProAction[]>;
    createProAction(action: IProAction): Promise<ProActionDoc | null>;
    calculateProsWithEarnings(
        userId: string,
        currentTime: number
    ): Promise<
        {
            pro: IPro;
            earnings: number;
            level: number;
            status: string;
            trainingEndDateTime: string | null;
            offerAccepted: boolean;
            payoutAmount: number | null;
        }[]
    >;
}
