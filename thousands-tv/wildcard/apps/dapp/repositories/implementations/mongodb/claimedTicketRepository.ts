import connectToDb from "@/db/connectToDb";
import { injectable } from "inversify";
import { IClaimedTicket } from "@repo/interfaces";
import { Types } from "mongoose";
import IClaimedTicketRepository from "@/repositories/interfaces/iClaimedTicketRepository";
import {
    accessCodeModel,
    ClaimedTicketDoc,
    claimedTicketsModel,
} from "@repo/schemas";

@injectable()
export default class ClaimedTicketRepository
    implements IClaimedTicketRepository
{
    async createClaimedTicket(
        claimedTicket: IClaimedTicket
    ): Promise<{ claimedTicket: ClaimedTicketDoc | null; error?: string }> {
        let session;
        try {
            await connectToDb();
            session = await claimedTicketsModel.startSession();
            session.startTransaction();

            const createdTicket = await claimedTicketsModel.create(
                [claimedTicket],
                { session }
            );

            if (claimedTicket.accessCodeId) {
                const updatedAccessCode =
                    await accessCodeModel.findOneAndUpdate(
                        {
                            _id: new Types.ObjectId(claimedTicket.accessCodeId),
                            "claimedUsers.claimedBy": new Types.ObjectId(
                                claimedTicket.userId
                            ),
                            $or: [
                                {
                                    "claimedUsers.claimedCodeEventId": {
                                        $exists: false,
                                    },
                                },
                                { "claimedUsers.claimedCodeEventId": null },
                            ],
                        },
                        {
                            $set: {
                                "claimedUsers.$.claimedCodeEventId":
                                    new Types.ObjectId(claimedTicket.eventId),
                            },
                        },
                        { new: true, session }
                    );

                if (!updatedAccessCode) {
                    await session.abortTransaction();
                    const infoMsg = `User Id ${claimedTicket.userId} has already claimed the access code ${claimedTicket.accessCodeId} for event ${claimedTicket.eventId}.`;
                    console.log(infoMsg);
                    return {
                        claimedTicket: null,
                        error: infoMsg,
                    };
                }
            }

            await session.commitTransaction();
            return { claimedTicket: createdTicket[0] };
        } catch (e: any) {
            console.log(
                `ClaimedTicketRepository.createClaimedTicket claimedTicket: ${JSON.stringify(
                    claimedTicket
                )} error: `,
                e
            );
            if (session) {
                await session.abortTransaction();
            }
            return { claimedTicket: null, error: e.message };
        } finally {
            if (session) {
                session.endSession();
            }
        }
    }
    async getClaimedTickets(): Promise<ClaimedTicketDoc[] | null> {
        try {
            await connectToDb();
            return await claimedTicketsModel.find({});
        } catch (e: any) {
            console.log(`ClaimedTicketRepository.getClaimedTickets error: `, e);
            return null;
        }
    }

    async getClaimedTicket(ticketId: string): Promise<ClaimedTicketDoc | null> {
        try {
            await connectToDb();
            const ticketIdIsValid = new Types.ObjectId(ticketId);
            return await claimedTicketsModel.findById(ticketIdIsValid);
        } catch (e: any) {
            console.log(
                `ClaimedTicketRepository.getClaimedTicket ticketId: ${ticketId} error: `,
                e
            );
            return null;
        }
    }

    async updateClaimedTicket(
        ticketId: string,
        updateParams: Partial<IClaimedTicket>
    ): Promise<ClaimedTicketDoc | null> {
        try {
            await connectToDb();
            const query = { _id: new Types.ObjectId(ticketId) };
            const update = { $set: updateParams };
            return await claimedTicketsModel.findOneAndUpdate(query, update, {
                new: true,
            });
        } catch (e: any) {
            console.log(
                `ClaimedTicketRepository.updateClaimedTicket ticketId: ${ticketId} updateParams: ${updateParams} error: `,
                e
            );
            return null;
        }
    }

    async getClaimedTicketByUserAndEvent(
        userId: string,
        eventId: string
    ): Promise<ClaimedTicketDoc | null> {
        try {
            await connectToDb();
            return await claimedTicketsModel.findOne({
                userId: new Types.ObjectId(userId),
                eventId,
            });
        } catch (e: any) {
            console.log(
                `ClaimedTicketRepository.getClaimedTicketByUserAndEvent userId: ${userId} eventId: ${eventId} error: `,
                e
            );
            return null;
        }
    }

    async countClaimedTicketsByEvent(eventId: string): Promise<number> {
        try {
            await connectToDb();
            return await claimedTicketsModel.countDocuments({ eventId });
        } catch (e: any) {
            console.log(
                `ClaimedTicketRepository.countClaimedTicketsByEvent eventId: ${eventId} error: `,
                e
            );
            return 0;
        }
    }

    // get all claimed tickets for a stage (to be used to fetch all users who have claimed a ticket for a stage opt. query data)
    async getClaimedTicketsByStage(
        stageId: string
    ): Promise<ClaimedTicketDoc[] | null> {
        try {
            await connectToDb();
            return await claimedTicketsModel.find({ stageId: stageId });
        } catch (e: any) {
            console.log(
                `ClaimedTicketRepository.getClaimedTicketsByStage stageId: ${stageId} error: `,
                e
            );
            return [];
        }
    }
}
