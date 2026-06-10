import { NextApiRequest, NextApiResponse } from "next";
import { diContainer } from "@/inversify.config";
import IStageRepository from "@/repositories/interfaces/iStageRepository";
import axios from "axios";
import { IUser } from "@repo/interfaces";
import Cookies from "js-cookie";
import { authorize } from "../middleware/authorization";
import { COOKIES_ACCESS_TOKEN_WILDCARD } from "@/utils/accountAPIUtil";
import { getSetWinnerEndpoint } from "@/utils/environmentUtil";

enum Team {
    RED = "red",
    BLUE = "blue",
}

type RequestResponse = {
    success: boolean;
    message: string;
    error: string;
};

async function handler(
    req: NextApiRequest,
    res: NextApiResponse<RequestResponse>,
    user: IUser
) {
    if (req.method !== "POST") {
        res.status(405).json({
            success: false,
            message: `Method ${req.method} Not Allowed`,
            error: "",
        });
        return;
    }

    if (!user) {
        res.status(401).json({
            success: false,
            message: "Unauthorized",
            error: "User not authenticated",
        });
        return;
    }

    try {
        const { team, stageId } = req.body;

        // Validate required fields
        if (!team || !stageId) {
            res.status(400).json({
                success: false,
                message: "Missing required fields: team and stageId",
                error: "Missing required fields",
            });
            return;
        }

        // Validate team value
        if (team !== Team.RED && team !== Team.BLUE) {
            res.status(400).json({
                success: false,
                message: "Team must be either 'red' or 'blue'",
                error: "Invalid team value",
            });
            return;
        }

        const stageRepository: IStageRepository =
            diContainer.get("IStageRepository");

        // Get the stage to verify it exists
        const stage = await stageRepository.getStage(stageId);

        if (stage == null) {
            res.status(404).json({
                success: false,
                message: "Stage not found",
                error: "Stage not found",
            });
            return;
        }

        const setWinnerEndpoint = getSetWinnerEndpoint();
        const wildcardAccessToken = Cookies.get(COOKIES_ACCESS_TOKEN_WILDCARD);

        const awsResponse = await axios.post(
            setWinnerEndpoint,
            {
                team,
                stageId,
            },
            {
                headers: {
                    Authorization: `Bearer ${wildcardAccessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        // AWS logic to set the winner
        // @dev - impl. as a placeholder to be updated w/ AWS endpoint response
        if (awsResponse.status !== 200) {
            res.status(500).json({
                success: false,
                message: "Error setting winner in AWS",
                error: "Error setting winner in AWS",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: `Successfully set ${team} team as the winner`,
            error: "",
        });
    } catch (error: any) {
        console.log("error setting winner: ", error);
        res.status(500).json({
            success: false,
            message: "Error setting winner",
            error: error.message,
        });
    }
}

export default authorize(handler);
