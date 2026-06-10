import { Types } from "mongoose";

export const PROS_TEST_TABLE_NAME = "pros-test";

export interface IProsTest {
    currentOffset: number;
    userId: Types.ObjectId;

    _id?: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
    __v?: number;
}
