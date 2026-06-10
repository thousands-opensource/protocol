import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import {
    getBeamApiUrl,
    getBeamCid,
    getBeamPid,
    getGamerTagPid,
} from "@/utils/environmentUtilWCA";
import { getAdminAccessToken } from "@/backend/common";
import {
    AccountProvider,
    AccountProviderType,
    BeamableAccountProvider,
    IUser,
    WildcardApiResponse,
} from "@repo/interfaces";
import {
    AccountProviderParams,
    getProviderPropertyName,
} from "@/utils/backend/accountsBackendUtil";
import connectToDb from "@/db/connectToDb";
import { UserDoc } from "@repo/schemas";
import { authorize } from "./middleware/authorization";
import { sendApiResponse } from "@/utils/backend/apiUtil";

const BEAM_API_URL = getBeamApiUrl();
const BEAM_CID = getBeamCid();
const BEAM_PID = getBeamPid();
const GAMER_TAG_PID = getGamerTagPid();
const BEAM_SCOPE = `${BEAM_CID}.${BEAM_PID}`;

async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "POST") {
        res.status(405).json({ message: "Method Not Allowed" });
        return;
    }

    const { steamId } = req.body;

    if (!steamId) {
        res.status(400).json({
            message: "Missing steamId.",
        });
        return;
    }

    try {
        await connectToDb();
        const accessToken = await getAdminAccessToken();

        if (!GAMER_TAG_PID) {
            const war: WildcardApiResponse = {
                success: false,
                err: "Missing Gamer Tag PID",
            };
            return sendApiResponse(res, war);
        }

        const response = await axios.get(
            `${BEAM_API_URL}/basic/accounts/search`,
            {
                params: { query: steamId, page: 1, pagesize: 1 },
                headers: {
                    accept: "application/json",
                    "X-DE-SCOPE": BEAM_SCOPE,
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (
            !response.data ||
            !response.data.accounts ||
            response.data.accounts.length === 0
        ) {
            const war: WildcardApiResponse = {
                success: false,
                err: "No beamable account available",
            };
            return sendApiResponse(res, war);
        }

        console.log("Found beamable account");
        const beamableAccount = response.data.accounts[0];

        const gamerTag = beamableAccount.gamerTags.find(
            (item: { projectId: string; gamerTag: number }) => {
                return (
                    item.projectId.toLowerCase() === GAMER_TAG_PID.toLowerCase()
                );
            }
        );
        if (!gamerTag) {
            const war: WildcardApiResponse = {
                success: false,
                err: "Failed to find projectId",
            };
            return sendApiResponse(res, war);
        }

        console.log("Found Gamer Tag");
        const gamerTagId = gamerTag.gamerTag;

        const linkingAccountObject: BeamableAccountProvider = {
            id: String(gamerTagId),
            name: "",
            image: "",
            email: "",
            isVerified: true,
            pid: GAMER_TAG_PID,
        };

        const providerPropertyName = getProviderPropertyName(
            AccountProviderType.BEAMABLE
        );

        if (user?.beamableProvider?.id) {
            const msg = `Account provider ${AccountProviderType.BEAMABLE} already is linked`;
            const war: WildcardApiResponse = {
                success: false,
                err: msg,
            };
            return sendApiResponse(res, war);
        }

        (user as any)[providerPropertyName] = linkingAccountObject;
        const userDoc = user as UserDoc;

        await userDoc.save();
        console.log("Account linked to user");
        const war: WildcardApiResponse = {
            success: true,
            data: userDoc as IUser,
        };
        return sendApiResponse(res, war);
    } catch (error: any) {
        console.error("Error storing beamable provider:", error);
        res.status(500).json({
            status: "Internal Server Error",
            message: "Failed to store beamable provider",
            details: error.message,
        });
    }
}

export default authorize(handler);
