import connectToDb from "@/db/connectToDb";
import { diContainer } from "@/inversify.config";
import ISeriesRepository from "@/repositories/interfaces/iSeriesRepository";
import IServerRepository from "@/repositories/interfaces/iServerRepository";
import { ISeries, UserRole } from "@repo/interfaces";
import mongoose, { ClientSession } from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "../middleware/authorization";
import { CreateSeriesCardProps } from "@/features/SeriesForm/interfaces";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        res.status(405).json({ message: `Method ${req.method} Not Allowed` });
        return;
    }

    const session: ClientSession = await mongoose.startSession();
    session.startTransaction();

    const body: CreateSeriesCardProps = req.body;
    console.log("Body: ", body);
    try {
        await connectToDb();

        const serverRepository: IServerRepository =
            diContainer.get("IServerRepository");

        const seriesRepository: ISeriesRepository =
            diContainer.get("ISeriesRepository");

        const server = await serverRepository.getServerFromCode(
            body.serverCode
        );

        if (!server) {
            res.status(404).json({ message: "Server not found" });
            return;
        }

        const newSeries: ISeries = {
            seriesName: body.seriesName,
            seriesDescription: body.seriesDescription,
            startDate: new Date(body.startDate),
            endDate: new Date(body.endDate),
            imageUrl: body.imageUrl,
            backgroundImageUrl: body.backgroundImageUrl,
            seriesPointConfiguration: body.seriesPointConfiguration,
        };

        const seriesUpdateResponse = await seriesRepository.createSeries(
            newSeries,
            session
        );
        const serverUpdateResponse = await serverRepository.addSeries(
            server._id.toString(),
            { ...newSeries, _id: seriesUpdateResponse?._id },
            session
        );

        if (!seriesUpdateResponse || !serverUpdateResponse) {
            await session.abortTransaction();

            res.status(500).json({
                message: "Error creating series",
            });
            return;
        }
        await session.commitTransaction();

        res.status(200).json({
            message: "Series created successfully",
            data: {
                series: seriesUpdateResponse,
                server: serverUpdateResponse,
            },
        });
    } catch (error: any) {
        if (session) {
            await session.abortTransaction();
        }
        res.status(500).json({
            status: error.response?.data?.status || "Internal Server Error",
            service: error.response?.data?.service || "N/A",
            error: error.response?.data.error || "Error creating series",
            message:
                error.response?.data?.message ||
                "No additional error information",
        });
    }
}

export default authorize(handler, [UserRole.ORGANIZER, UserRole.ADMIN]);
