import { injectable } from "inversify";
import connectToDb from "@/db/connectToDb";
import IAccessCodeRepository from "@/repositories/interfaces/iAccessCodeRepository";
import {
    accessCodeModel,
    findOneUserByQuery,
    updateOneUserDB,
} from "@repo/schemas";
import {
    IAccessCode,
    AccessCodeType,
    AccessCodeIntent,
    UserRole,
} from "@repo/interfaces";
import { ClientSession, Types, UpdateQuery } from "mongoose";

/**
 * Custom hook to check if the user has already claimed the access code by intent
 * @param userId - The ID of the user
 * @param accessCode - The access code document
 * @param session - The current MongoDB session to ensure transactional consistency
 * @returns {Promise<boolean>} - Returns true if the user has already claimed the access code
 */
const hasUserClaimedAccessCode = async (
    userId: Types.ObjectId,
    accessCode: IAccessCode,
    session: ClientSession | null = null
): Promise<boolean> => {
    if (accessCode.intent === AccessCodeIntent.ACCESS_ROLE) {
        // Check if the user has already claimed any of the roles in accessRoles within the same transaction
        const claimedRole = await accessCodeModel
            .findOne({
                _id: accessCode._id, // Ensure the check is for this specific access code
                "claimedUsers.claimedBy": userId,
                accessRoles: { $in: accessCode.accessRoles }, // Check across all roles
                intent: AccessCodeIntent.ACCESS_ROLE,
            })
            .session(session); // Ensure the session is used here

        return !!claimedRole; // Returns true if any role is already claimed
    }

    if (accessCode.intent === AccessCodeIntent.TICKET) {
        // Check for claimed tickets using claimedCodeEventId
        const userAlreadyClaimed = accessCode.claimedUsers.some(
            (user: {
                claimedBy: Types.ObjectId;
                claimedCodeEventId?: Types.ObjectId | null;
            }) => user.claimedBy.toString() === userId.toString()
        );
        return userAlreadyClaimed;
    }

    return false;
};

@injectable()
export default class AccessCodeRepository implements IAccessCodeRepository {
    async createAccessCode(
        accessCode: IAccessCode
    ): Promise<IAccessCode | null> {
        try {
            await connectToDb();
            return await accessCodeModel.create(accessCode);
        } catch (e: any) {
            console.log(`AccessCodeRepository.createAccessCode error: `, e);
            return null;
        }
    }

    async findAccessCodeByCode(
        accessCode: string
    ): Promise<IAccessCode | null> {
        try {
            await connectToDb();
            return await accessCodeModel.findOne({ accessCode });
        } catch (e: any) {
            console.log(`AccessCodeRepository.findAccessCodeByCode error: `, e);
            return null;
        }
    }

    async findValidAccessCodesByUserIdAndseriesId(
        userId: string,
        seriesId: string
    ): Promise<IAccessCode[]> {
        try {
            await connectToDb();
            return await accessCodeModel.find({
                "claimedUsers.claimedBy": new Types.ObjectId(userId),
                seriesId: new Types.ObjectId(seriesId),
            });
        } catch (e: any) {
            console.log(
                `AccessCodeRepository.findValidAccessCodesByUserIdAndseriesId error: `,
                e
            );
            return [];
        }
    }

    async claimAccessCode(
        accessCodeId: string,
        userId: string
    ): Promise<IAccessCode | null> {
        let session: ClientSession | null = null;
        try {
            // Connect to DB and start a session
            await connectToDb();
            session = await accessCodeModel.startSession();
            session.startTransaction();

            const accessCodeDoc = await accessCodeModel
                .findById(accessCodeId)
                .session(session);

            if (!accessCodeDoc) {
                throw new Error("Access code not found");
            }

            if (accessCodeDoc.isClaimed) {
                throw new Error("Access code is already claimed");
            }

            if (
                accessCodeDoc.claimedUsers.length >= accessCodeDoc.maxQuantity
            ) {
                throw new Error("All access codes have been claimed");
            }

            // Check if user has already claimed the access code
            const userAlreadyClaimed = await hasUserClaimedAccessCode(
                new Types.ObjectId(userId),
                accessCodeDoc,
                session // Ensure session is passed for consistency
            );

            if (userAlreadyClaimed) {
                if (accessCodeDoc.codeType === AccessCodeType.MULTI_USE) {
                    throw new Error(
                        "User has already claimed this multi-use access code"
                    );
                } else if (
                    accessCodeDoc.codeType === AccessCodeType.SINGLE_USE
                ) {
                    throw new Error(
                        "User has already claimed this single-use access code"
                    );
                }
            }

            // Add the user to the claimedUsers list
            const updateQuery: UpdateQuery<IAccessCode> = {
                $push: {
                    claimedUsers: {
                        claimedBy: new Types.ObjectId(userId),
                    },
                },
            };

            if (
                accessCodeDoc.claimedUsers.length + 1 >=
                accessCodeDoc.maxQuantity
            ) {
                updateQuery.$set = { isClaimed: true };
            }

            // Update the access code with the claimed user in the same transaction
            const updatedAccessCode = await accessCodeModel.findByIdAndUpdate(
                accessCodeId,
                updateQuery,
                { new: true, session }
            );

            if (!updatedAccessCode) {
                throw new Error("Failed to update access code");
            }

            // Perform intent-based action (such as updating user roles)
            await executeIntentAction(
                accessCodeDoc,
                new Types.ObjectId(userId),
                session
            );

            // Commit the transaction if everything succeeds
            await session.commitTransaction();

            return updatedAccessCode;
        } catch (error) {
            if (session && session.inTransaction()) {
                await session.abortTransaction(); // Only abort if the transaction is still active
            }
            throw error;
        } finally {
            if (session) {
                session.endSession();
            }
        }
    }

    async getAccessCodeRoles(accessCode: string): Promise<string[] | null> {
        try {
            await connectToDb();
            const code = await accessCodeModel.findOne({ accessCode });
            return code ? code.accessRoles : null;
        } catch (e: any) {
            console.error(`AccessCodeRepository.getAccessCodeRoles error: `, e);
            return null;
        }
    }

    async hasClaimedClaimedAccessCodeByUserId(
        userId: string,
        accessCode: string // Access code as a string
    ): Promise<boolean> {
        // Retrieve the access code document based on the string
        const accessCodeDocument = await accessCodeModel.findOne({
            accessCode,
        });

        if (!accessCodeDocument) {
            return false; // Access code doesn't exist
        }

        // convert the userId to ObjectId
        const userIdObjectId = new Types.ObjectId(userId);

        // Reuse the existing method to check if the user has claimed this access code
        return hasUserClaimedAccessCode(userIdObjectId, accessCodeDocument);
    }
}

/*
 * Executes actions based on the access code intent.
 * @param accessCode The access code being claimed
 * @param userId The user claiming the access code
 * @param session The MongoDB session to ensure atomicity
 */
export const executeIntentAction = async (
    accessCode: IAccessCode,
    userId: Types.ObjectId,
    session: ClientSession
): Promise<void> => {
    switch (accessCode.intent) {
        case AccessCodeIntent.ACCESS_ROLE:
            await updateUserAccessRoles(accessCode, userId, session);
            break;

        // todo: @dev - add more cases here for other intents in the future

        default:
            console.log(
                `No specific action for intent: ${
                    accessCode.intent
                } for UserId ${userId.toString()} `
            );
            break;
    }
};

/**
 * Handles the update of user access roles based on the access code.
 * @param accessCode The access code containing roles to be granted
 * @param userId The ID of the user to update
 * @param session The MongoDB session to ensure atomicity
 */
const updateUserAccessRoles = async (
    accessCode: IAccessCode,
    userId: Types.ObjectId,
    session: ClientSession
): Promise<void> => {
    if (accessCode.accessRoles) {
        // Fetch the user DB record
        const userDB = await findOneUserByQuery({ _id: userId }); // Implement the actual function

        if (!userDB) {
            throw new Error("User not found");
        }

        const newRolesSet = new Set(userDB.roles);
        accessCode.accessRoles.forEach((role: UserRole) =>
            newRolesSet.add(role)
        );

        const newRoles = Array.from(newRolesSet);

        // Update the user's roles in the same transaction
        await updateOneUserDB(
            { _id: userId },
            { $set: { roles: newRoles } },
            { session } // Ensure updating roles is part of the atomic transaction
        );

        console.log(
            `Updated roles for user ${userId.toString()} based on access code intent.`
        );
    }
};
