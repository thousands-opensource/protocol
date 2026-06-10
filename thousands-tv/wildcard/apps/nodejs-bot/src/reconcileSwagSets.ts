import moduleAlias from "module-alias";
moduleAlias.addAliases({
    "@src": `${__dirname}/`,
});
import { getWildcardSwagContractAddress } from "@src/util/environmentUtil";
import {
    clearAllSwagSets,
    findSwagSetsByQuery,
    insertManySwagSets,
} from "@repo/schemas";
import { logInfo } from "@src/logger";
import {
    MELEE_ON_THE_METEOR_TITLE,
    COMMUNITY_GATHERINGS_TITLE,
    ROAD_TO_EX1_TITLE,
    PRE_ALPHA_PARTNERS_ACTIVATIONS_TITLE,
    ULTIMATE_FAN_TITLE,
    COMMUNITY_GATHERINGS_TOKEN_IDS,
    MELEE_ON_THE_METEOR_TOKEN_IDS,
    PRE_ALPHA_PARTNERS_ACTIVATIONS_TOKEN_IDS,
    ROAD_TO_EX1_TOKEN_IDS,
    ULTIMATE_FAN_TOKEN_IDS,
    MOODS_OF_BOLGAR_TOKEN_IDS,
    MOODS_OF_BOLGAR_TITLE,
    SPAWN_OF_SPORD_TOKEN_IDS,
    SPAWN_OF_SPORD_TITLE,
} from "./constants";
import { ISwagSet } from "@repo/interfaces";

/**
 * Handles reconciling swag sets in database
 */
export async function handleReconcileSwagSets() {
    logInfo(`Running handleReconcileSwagSets`);
    const wildcardSwagContractAddress = getWildcardSwagContractAddress();

    logInfo(
        "using wildcardSwagContractAddress: " + wildcardSwagContractAddress
    );

    const swagSets: ISwagSet[] = [
        {
            // MELEE ON THE METEOR
            title: MELEE_ON_THE_METEOR_TITLE,
            tokenIds: MELEE_ON_THE_METEOR_TOKEN_IDS,
            contractAddress: wildcardSwagContractAddress,
        },
        {
            // COMMUNITY GATHERINGS
            title: COMMUNITY_GATHERINGS_TITLE,
            tokenIds: COMMUNITY_GATHERINGS_TOKEN_IDS,
            contractAddress: wildcardSwagContractAddress,
        },
        {
            // ROAD TO EX1
            title: ROAD_TO_EX1_TITLE,
            tokenIds: ROAD_TO_EX1_TOKEN_IDS,
            contractAddress: wildcardSwagContractAddress,
        },
        {
            // PRE-ALPHA PARTNER ACTIVATIONS
            title: PRE_ALPHA_PARTNERS_ACTIVATIONS_TITLE,
            tokenIds: PRE_ALPHA_PARTNERS_ACTIVATIONS_TOKEN_IDS,
            contractAddress: wildcardSwagContractAddress,
        },
        {
            // ULTIMATE FAN
            title: ULTIMATE_FAN_TITLE,
            tokenIds: ULTIMATE_FAN_TOKEN_IDS,
            contractAddress: wildcardSwagContractAddress,
        },
        {
            // MOODS OF BOLGAR
            title: MOODS_OF_BOLGAR_TITLE,
            tokenIds: MOODS_OF_BOLGAR_TOKEN_IDS,
            contractAddress: wildcardSwagContractAddress,
        },
        {
            // SPAWN OF SPORD
            title: SPAWN_OF_SPORD_TITLE,
            tokenIds: SPAWN_OF_SPORD_TOKEN_IDS,
            contractAddress: wildcardSwagContractAddress,
        },
    ];

    // logic to see if we need to update swag sets
    let updateNeeded = false;
    const dbSwagSets: ISwagSet[] = await findSwagSetsByQuery({});
    if (dbSwagSets.length !== swagSets.length) {
        updateNeeded = true;
    }

    for (const dbSwagSet of dbSwagSets) {
        const dbSwagSetTitle = dbSwagSet.title;
        const isTitleInDb = swagSets.some((swagSet) => {
            return swagSet.title === dbSwagSetTitle;
        });
        if (!isTitleInDb) {
            updateNeeded = true;
            break;
        }
    }

    if (!updateNeeded) {
        logInfo(`No need to update swagSets`);
        return;
    }

    // wipe swag sets in database
    await clearAllSwagSets();

    // insert new ones
    await insertManySwagSets(swagSets);

    const formattedSetNames = [
        MELEE_ON_THE_METEOR_TITLE,
        COMMUNITY_GATHERINGS_TITLE,
        ROAD_TO_EX1_TITLE,
        PRE_ALPHA_PARTNERS_ACTIVATIONS_TITLE,
        ULTIMATE_FAN_TITLE,
        MOODS_OF_BOLGAR_TITLE,
        SPAWN_OF_SPORD_TITLE,
    ].join("\n");

    logInfo(
        `Finished updating swag sets. Added ${swagSets.length} set(s):\n${formattedSetNames}`
    );
}
