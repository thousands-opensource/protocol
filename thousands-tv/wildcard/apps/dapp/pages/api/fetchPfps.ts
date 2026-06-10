import connectToDb from "@/db/connectToDb";
import {
    AccountProviderType,
    PfpMetadata,
    WildcardApiResponse,
} from "@repo/interfaces";
import { getOwnedPFPNfts } from "@/utils/backend/alchemyUtil";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import { NextApiRequest, NextApiResponse } from "next";
import { authorize } from "./middleware/authorization";
import { IUser } from "@repo/interfaces";
import { Network, OwnedNft, OwnedNftsResponse } from "alchemy-sdk";
import { isProdEnvironment } from "@/utils/environmentUtil";
import { getAllAssociatedWalletsForUser } from "@/utils/userUtil";

/**
 * NextJS API Route Handler - POST request for fetching PFPs.
 * @param req - The request object.
 * @param res - The response object.
 * @param user - The authorized user object.
 */
async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "POST") {
        sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
        });
        return;
    }

    try {
        await connectToDb();
        const war: WildcardApiResponse = await fetchPfps(req, user);
        sendApiResponse(res, war);
    } catch (e: any) {
        console.error("Error unable to fetch PFPs", e);
        sendApiResponse(res, {
            success: false,
            err: `Error unable to fetch PFPs: ${e.message}`,
        });
    }
}

/**
 * Fetch PFPs for the user from account providers and multiple networks.
 * @param req - The API request object.
 * @param user - The authorized user object.
 * @returns A WildcardApiResponse containing PFP data.
 */

async function fetchPfps(req: NextApiRequest, user: IUser) {
    const {
        nextPageKeys = {},
        networks = [],
    }: { nextPageKeys: Record<string, string>; networks: Network[] } = req.body;

    if (networks.length === 0) {
        return {
            success: false,
            data: { err: "No networks provided." },
        };
    }

    const addressesToFetch: string[] = getAllAssociatedWalletsForUser(user);
    // *** Uncomment the following block to fetch additional PFPs for testing ***
    // if (!isProdEnvironment()) {
    //     addressesToFetch.push(
    //         "0x65B2f2a016424438d4D1841f9A69E1eE76704CbA",
    //         "0xF65c1c42745606E397bb2993E25E09382a16Fb87",
    //         "0x08DbC3D0D6209d13D2e1FC1A9A4E01D93b8Faeed"
    //     );
    // }

    if (addressesToFetch.length === 0) {
        return {
            success: false,
            data: { err: "No addresses associated with the user." },
        };
    }

    console.log("Processing networks:", networks);
    console.log("Addresses to fetch PFPs:", addressesToFetch);

    // Define a base PfpMetadata object
    const basePfpMetadata: PfpMetadata = {
        tokenId: "",
        contractAddress: "",
        chainId: 0,
        name: "",
        imageUrl: "",
    };

    // Create accountProviderPfps array by mapping over providers
    const providers = [
        {
            image: user.twitterProvider?.image,
            type: AccountProviderType.TWITTER,
            name: "Twitter Profile Picture",
        },
        {
            image: user.discordProvider?.image,
            type: AccountProviderType.DISCORD,
            name: "Discord Profile Picture",
        },
        {
            image: user.googleProvider?.image,
            type: AccountProviderType.GOOGLE,
            name: "Google Profile Picture",
        },
        {
            image: user.twitchProvider?.image,
            type: AccountProviderType.TWITCH,
            name: "Twitch Profile Picture",
        },
        {
            image: user.beamableProvider?.image,
            type: AccountProviderType.BEAMABLE,
            name: "Beamable Profile Picture",
        },
    ];

    const accountProviderPfps: PfpMetadata[] = providers
        .filter((provider) => provider.image) // Filter out undefined or empty images
        .map((provider) => ({
            ...basePfpMetadata,
            imageUrl: provider.image || "",
            accountProviderType: provider.type,
            name: provider.name,
        }));

    let nftPfps: OwnedNft[] = [];
    let pageKeys: Record<string, string[]> = {};
    let totalPfpCount = 0;

    for (const network of networks) {
        const promises: Promise<OwnedNftsResponse>[] = [];
        for (const address of addressesToFetch) {
            try {
                const pageKey = nextPageKeys[network] || undefined;
                promises.push(getOwnedPFPNfts(address, pageKey, network));
            } catch (error) {
                console.error(
                    `Error initiating fetch for ${address} on ${network}:`,
                    error
                );
            }
        }

        const results = await Promise.allSettled(promises);
        results.forEach((result, index) => {
            if (result.status === "fulfilled") {
                const response = result.value;
                nftPfps = nftPfps.concat(response.ownedNfts);
                pageKeys[network] = pageKeys[network] || [];
                pageKeys[network][index] = response.pageKey || "end";
                totalPfpCount += response.totalCount;
            } else {
                console.error(`Failed to fetch NFTs:`, result.reason);
            }
        });
    }

    return {
        success: true,
        data: {
            accountProviderPfps,
            nftPfps,
            pageKeys,
            totalCount: totalPfpCount,
        },
    };
}

export default authorize(handler);
