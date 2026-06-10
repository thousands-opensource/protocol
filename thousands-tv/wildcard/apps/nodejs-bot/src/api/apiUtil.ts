import { TxnTypeEnum } from "@repo/interfaces";

export function isTxnTypeEnum(type: any): type is TxnTypeEnum {
    return Object.values(TxnTypeEnum).includes(type);
}

export function getTxnTypeEnum(type: string): TxnTypeEnum | undefined {
    const txnType = Object.values(TxnTypeEnum).find(
        (enumType) => enumType === type
    );
    return txnType as TxnTypeEnum | undefined;
}
