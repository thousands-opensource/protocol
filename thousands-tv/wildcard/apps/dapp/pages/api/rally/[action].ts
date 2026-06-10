import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import {
    getIvsGameEventUrl,
    getIvsIdleGameGameApiKey,
} from "@/utils/environmentUtilWCA";
import authorizeAdmin from "../middleware/authorizationAdmin";

type RallyResponse = {
    success: boolean;
    message: string;
    error?: string;
};

const MATCH_ID = "Match1";
const TIMESTAMP = Date.now();
const BASE_EVENT = {
    Timestamp: TIMESTAMP,
    Target: "None",
    Instigator: "None",
    ContextTags: [],
};

const START_DATA = {
    Team0Champion: "Bolgar",
    Team1Champion: "Locke",
    Team0Sidekick: "Burr",
    Team1Sidekick: "Volt",
    Team0Name: "Blue",
    Team0GamerTag: "1774066116463616",
    Team1Name: "Red",
    Team1GamerTag: "1774247706857473",
    Team0ShortName: "Blue",
    Team0Color: "78BA2FFF",
    Team1ShortName: "Red",
    Team1Color: "C6A400FF",
};

async function handler(
    req: NextApiRequest,
    res: NextApiResponse<RallyResponse>
) {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method not allowed",
        });
    }

    try {
        const { action } = req.query;
        const { vendorEventId } = req.body;

        if (!vendorEventId) {
            return res.status(400).json({
                success: false,
                message: "vendorEventId is required",
            });
        }

        const payload = {
            EventId: vendorEventId,
            MatchId: MATCH_ID,
            Events: [
                {
                    ...BASE_EVENT,
                    Name:
                        action === "start" ? "MatchStarted" : "ChampionScored",
                    Data: action === "start" ? START_DATA : {},
                },
            ],
        };

        const response = await axios.post(getIvsGameEventUrl(), payload, {
            headers: {
                "x-api-key": getIvsIdleGameGameApiKey(),
                "Content-Type": "application/json",
            },
        });

        if (!response.data.Success) 
        {
           return res.status(500).json({
                success: false,
                message: "Failed to process rally action",
                error: response.data.Err,
            }); 
        }

        return res.status(200).json({
            success: true,
            message: `Rally ${action} successful`,
        });
    } catch (error: any) {
        console.error("Rally error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to process rally action",
            error: error.message,
        });
    }
}

export default authorizeAdmin(handler);
