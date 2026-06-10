import { diContainer } from "@/inversify.config";
import { authorize } from "@/pages/api/middleware/authorization";
import IRecognitionProgramRepository from "@/repositories/interfaces/IRecognitionProgramRepository";
import { fetchSwagWildpassesByUserAndNetwork } from "@/utils/backend/alchemyUtil";
import {
    IRecognitionProgram,
    ISeries,
    IUser,
    MetadataAttribute,
    PointItem,
} from "@repo/interfaces";
import { UserDoc } from "@repo/schemas";
import { OwnedNft } from "alchemy-sdk";
import connectToDb from "@/db/connectToDb";
import { NextApiRequest, NextApiResponse } from "next";
import { isProdEnvironment } from "@/utils/environmentUtil";
import {
    WILDCARD_SWAG_CONTRACT_ADDRESS,
    WildpassColors,
} from "@/constants/constants";

async function getRecognitionProgramProfile(
    req: NextApiRequest,
    res: NextApiResponse,
    user: UserDoc
) {
    try {
        await connectToDb();
        // Access the series ID from the query parameters
        const { recognitionProgramId } = req.query;

        if (typeof recognitionProgramId !== "string") {
            return res
                .status(400)
                .json({ error: `Must provide a valid recognitionProgramId` });
        }

        // get recognition program info from id
        const recognitionProgramRepository: IRecognitionProgramRepository =
            diContainer.get("IRecognitionProgramRepository");
        const recognitionProgram =
            await recognitionProgramRepository.getRecognitionProgram(
                recognitionProgramId
            );

        if (!recognitionProgram) {
            return res.status(404).json({
                error: `Recognition program ${recognitionProgramId} not found`,
            });
        }

        const userToFetch: IUser = user;
        const networkId =
            recognitionProgram.pointConfiguration[0].pointItemCollections[0]
                .pointItems[0].networkId;
        const userWildpassSwagPins = await fetchSwagWildpassesByUserAndNetwork(
            userToFetch,
            networkId
        );
        const userNfts: OwnedNft[] = [
            ...userWildpassSwagPins.wildpasses,
            ...userWildpassSwagPins.swagPins,
        ];

        let totalPoints = 0;

        /**
         * Filters the recognition program configuration based on the user's NFTs.
         * Iterates through each point item collection and each point item
         * and checks if the user has an NFT that satisfies the point item.
         * If so, it adds the point item to the collection and adds the points
         * for that item to the total points. If the user has all the NFTs in
         * the collection, it adds the bonus points for the collection to the
         * total points. Then, it filters out any collections or categories
         * that have no point items.
         * @param recognitionProgramConfig - The recognition program configuration to filter.
         * @param userNFTs - The user's NFTs to check against the series configuration.
         * @returns The filtered series configuration.
         */
        const filterRecognitionProgramConfigForUserNFTs = (
            recognitionProgramConfig: IRecognitionProgram,
            userNFTs: OwnedNft[]
        ): IRecognitionProgram => {
            return {
                ...recognitionProgramConfig,
                pointConfiguration: recognitionProgramConfig.pointConfiguration
                    .map((category) => ({
                        ...category,
                        pointItemCollections: category.pointItemCollections
                            .map((collection) => ({
                                ...collection,
                                pointItems: collection.pointItems.reduce<
                                    PointItem[]
                                >((acc, pointItem) => {
                                    const matchingNFT = userNFTs.find((nft) =>
                                        doesNftSatisfyPointItem(nft, pointItem)
                                    );

                                    if (matchingNFT) {
                                        if (
                                            matchingNFT.balance !== "" &&
                                            parseInt(matchingNFT.balance) !==
                                                Number.NaN
                                        ) {
                                            pointItem.quantityOwned = parseInt(
                                                matchingNFT.balance
                                            );
                                        } else {
                                            pointItem.quantityOwned = 0;
                                        }
                                    } else {
                                        pointItem.quantityOwned = 0;
                                    }
                                    acc.push({ ...pointItem });

                                    return acc;
                                }, []),
                            }))
                            .filter(
                                (collection) => collection.pointItems.length > 0
                            ),
                    }))
                    .filter(
                        (category) => category.pointItemCollections.length > 0
                    ),
            };
        };

        const filteredRecognitionProgram: IRecognitionProgram =
            filterRecognitionProgramConfigForUserNFTs(
                recognitionProgram,
                userNfts
            );
        var recognitionItems = filteredRecognitionProgram.pointConfiguration;

        //Loop through recognition items and set showCompleteSetImageUrl if we have at least one of each item in the collection
        for (var recognitionItem of recognitionItems) {
            for (var pointItemCollection of recognitionItem.pointItemCollections) {
                const totalPointItems = pointItemCollection.pointItems.length;
                var countOfPointItemsOwned = 0;
                for (var pointItem of pointItemCollection.pointItems) {
                    if (pointItem.quantityOwned > 0) {
                        countOfPointItemsOwned++;
                    }
                }
                if (countOfPointItemsOwned === totalPointItems) {
                    pointItemCollection.showCompleteSetImageUrl = true;
                } else {
                    pointItemCollection.showCompleteSetImageUrl = false;
                }
                pointItemCollection.countOfPointItemsOwned =
                    countOfPointItemsOwned;
            }
        }

        res.json({
            //  nfts: userNfts, // <-- uncomment for testing
            totalPoints,
            recognitionItems,
        });
    } catch (error: any) {
        console.error("Error -", error, " \nreq.body:", req.body);
        res.status(500).json({
            status: "Internal Server Error",
            error: "Error handling user recognition program profile",
            message: error.message,
        });
    }
}

const doesNftSatisfyMetadata = (
    nft: OwnedNft,
    requiredMetadata: MetadataAttribute[]
) => {
    const nftMetadata: Record<string, any> = nft.raw.metadata;

    // Early return if nftMetadata doesn't have an attributes array
    if (!Array.isArray(nftMetadata.attributes)) {
        return false;
    }

    // Convert nftMetadata attributes to a format matching MetadataAttribute
    const normalizedAttributes = nftMetadata.attributes.map((attr: any) => ({
        traitType: attr.trait_type || attr.traitType,
        value: attr.value?.toString(), // Convert value to string for consistent comparison
    }));

    // Check if all required metadata attributes exist in the normalized attributes
    return requiredMetadata.every((required) =>
        normalizedAttributes.some(
            (attr) =>
                attr.traitType === required.traitType &&
                attr.value === required.value
        )
    );
};

/**
1%8= 1 azure
2%8= 2 gold
3%8= 3 scarlet
4%8= 4 violet
5%8= 5 amber
6%8= 6 emerald
7%8= 7 alabaster
8%8= 0 blush
*/

const doesNftSatisfyPointItem = (nft: OwnedNft, pointItem: PointItem) => {
    const modulusTokenId =
        Number(nft.tokenId) % Object.keys(WildpassColors).length;

    //If Swag on Polygon
    const wildcardSwagContractAddress =
        WILDCARD_SWAG_CONTRACT_ADDRESS.toLowerCase();
    if (
        pointItem.contractAddress.toLowerCase() == wildcardSwagContractAddress
    ) {
        const tokenIdReq = pointItem.tokenId
            ? nft.tokenId === pointItem.tokenId
            : false;

        if (
            nft.contract.address.toLowerCase() ===
                pointItem.contractAddress.toLowerCase() &&
            tokenIdReq
        ) {
            return true;
        }

        return false;
    } else {
        const tokenIdReq = pointItem.tokenId
            ? modulusTokenId.toString() === pointItem.tokenId
            : false;
        if (
            nft.contract.address.toLowerCase() ===
                pointItem.contractAddress.toLowerCase() &&
            tokenIdReq
        ) {
            return true;
        }

        return false;
    }
};

export default authorize(getRecognitionProgramProfile);
