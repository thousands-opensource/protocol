import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import { IUser } from "@repo/interfaces";
import IEventService from "@/services/interfaces/iEventService";
import { authorize } from "@/pages/api/middleware/authorization";
import { FanfareEffect } from "@/services/interfaces/iFanVisibilityService";

type RequestBody = {
    vendorEventId: string;
    boostType: string;
    boostAmount: number;
};

type RequestResponse = {
    success: boolean;
    message?: string;
    error?: string;
};

/**
 * Get the credit balance for a user
 * @param req
 * @param res
 * @returns
 */
async function handler(
    req: NextApiRequest,
    res: NextApiResponse<RequestResponse>,
    user: IUser
) {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: `Method ${req.method} Not Allowed`,
            error: "",
        });
    }

    try {
        const { vendorEventId, boostType, boostAmount }: RequestBody = req.body;

        const userId = user._id?.toString() ?? "";

        if (userId === "") {
            return res.status(400).json({
                success: false,
                message: "Missing userId from authorization",
                error: "userId is required",
            });
        }
        if (!boostType) {
            return res.status(400).json({
                success: false,
                message: "Missing boostType parameter",
                error: "boostType is required",
            });
        }
        if (!boostAmount) {
            return res.status(400).json({
                success: false,
                message: "Missing boostAmount parameter",
                error: "boostAmount is required",
            });
        }

        const IEventService: IEventService = diContainer.get("IEventService");

        var fanfareEffects: FanfareEffect[] = [{
            type: "AudienceBillboard",
            name: "ff.bb.MalusFoamFinger",
            value: "RandomActivation",
            sectionId: 0,
            sectionName: "SpectatorSplines/Section1B",
            magnitude: 15,
            delay: 0,
            duration: 25,
            notify: false,
        }];

        if (boostType == "foamfinger") {
            fanfareEffects = [{
                type: "AudienceBillboard",
                name: "ff.bb.MalusFoamFinger",
                value: "RandomActivation",
                sectionId: 0,
                sectionName: "",
                magnitude: 15,
                delay: 0,
                duration: 30,
                notify: false,
            },
            {
                type: "AudienceBillboard",
                name: "ff.ns.CameraFlashes01",
                value: "RandomActivation",
                sectionId: 0,
                sectionName: "",
                magnitude: 15,
                delay: 0,
                duration: 30,
                notify: false,
            }];
        }
        else if (boostType == "fireworks") {
            fanfareEffects = [{
                type: "AudienceNiagara",
                name: "ff.ns.LubabubFireworks01",
                value: "RandomActivation",
                sectionId: 0,
                sectionName: "",
                magnitude: 30,
                delay: 0,
                duration: 1,
                notify: false,
            },
            {
                type: "AudienceBillboard",
                name: "ff.ns.CameraFlashes01",
                value: "RandomActivation",
                sectionId: 0,
                sectionName: "",
                magnitude: 15,
                delay: 0,
                duration: 30,
                notify: false,
            }];
        }
        else if (boostType == "thewave") {
            fanfareEffects = [{
                type: "AudienceWave",
                name: "ff.aw.AudienceWave01",
                value: "",
                sectionId: 0,
                sectionName: "",
                magnitude: 3, //How many times it goes around
                delay: 0,
                duration: 30, //Not used for wave
                notify: false,
            }];
        }

        const result = await IEventService.sendBoost(
            vendorEventId,
            userId,
            fanfareEffects
        );

        console.log("sendBoost response: ", result);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Error sending boost",
                error: "Send Boost returned an error",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Successfully sent boost",
        });
    } catch (error: any) {
        console.error("Error sending boost:", error);
        return res.status(500).json({
            success: false,
            message: "Error sending boost",
            error: error.message,
        });
    }
}

export default authorize(handler);
