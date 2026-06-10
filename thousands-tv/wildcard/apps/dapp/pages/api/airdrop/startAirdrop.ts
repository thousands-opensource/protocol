import { sendApiResponse } from "@/utils/backend/apiUtil";
import { WildcardApiResponse } from "@repo/interfaces";
import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import { getAirDropGifts, getIvsAirdropUrl, getIvsIdleGamePlatformApiKey } from "../../../utils/environmentUtilWCA";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
        });
        return;
    }

    try {
        const {
            vendorEventId,
            giftId,
            giftQuantity,
        } = req.body;
        if (
            !vendorEventId ||
            !giftId ||
            !giftQuantity
        ) {
            console.error("Invalid start airdrop body");
            sendApiResponse(res, {
                success: false,
                err: `Invalid start airdrop body`,
            });
            return;
        }

        //Lookup giftName, giftDescription, and giftImageUrl
        const airdropGiftsStr = getAirDropGifts();
        const airdropGifts = JSON.parse(airdropGiftsStr) as {
            Id: string;
            Name: string;
            ImageUrl: string;
            Description: string;
            Metadata: { Set: string; Materials: string; }
        }[];

        console.log("airdropGifts: ", airdropGifts);

        var giftName = "";
        var giftDescription = "";
        var giftImageUrl = "";
        var giftSet = "";
        var giftMaterials = "";
        airdropGifts.forEach((airdropGift) => {
            if (airdropGift.Id === giftId) {
                giftName = airdropGift.Name;
                giftDescription = airdropGift.Description;
                giftImageUrl = airdropGift.ImageUrl;
                giftSet = airdropGift.Metadata.Set;
                giftMaterials = airdropGift.Metadata.Materials;
            }
        });

        if (giftName === "") {
            sendApiResponse(res, {
                success: false,
                err: `Invalid Gift`,
            });
            return;
        }

        //Convert the incoming string to a number
        const giftIdInt: number = parseInt(giftId);

        const war: WildcardApiResponse = await sendAirdrop(
            vendorEventId,
            giftIdInt,
            giftQuantity,
            giftName,
            giftDescription,
            giftImageUrl,
            giftSet,
            giftMaterials,
        );
        sendApiResponse(res, war);
    } catch (e: any) {
        console.error("Error starting airdrop", e);
        sendApiResponse(res, {
            success: false,
            err: `Error starting airdrop ${e.message}`,
        });
    }
}

async function sendAirdrop(
    vendorEventId: string,
    giftId: number,    
    giftQuantity: number,
    giftName: string,
    giftDescription: string,
    giftImageUrl: string,
    giftSet: string,
    giftMaterials: string,
) {
    const ivsIdleGamePlatformApiKey = getIvsIdleGamePlatformApiKey();

    const airdropUrl = getIvsAirdropUrl();

    const { data } = await axios.post(
        airdropUrl,
        {
            VendorEventId: vendorEventId,
            GiftId: giftId,
            GiftQuantity: giftQuantity,
            GiftName: giftName,
            GiftDescription: giftDescription,
            GiftImageUrl: giftImageUrl,
            GiftSet: giftSet,
            GiftMaterials: giftMaterials
        },
        {
            headers: {
                "Content-Type": "application/json",
                "x-api-key": ivsIdleGamePlatformApiKey,
            },
        }
    );
    return { success: true, data: data };
}

export default handler;
