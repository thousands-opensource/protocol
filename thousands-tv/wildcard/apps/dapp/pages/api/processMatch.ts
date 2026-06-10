import type { Model } from "mongoose";
import { NextApiRequest, NextApiResponse } from "next";
import { sendApiResponse } from "@/utils/backend/apiUtil";
import {
    ICastCard,
    ICastCard2,
    IDamageTracking,
    IDamageTracking2,
    ILoadout,
    ILoadout2,
    IMatchResults,
    IMatchResults2,
    IMetric,
    IPlayerData,
    IPlayerData2,
    IStatusTracking,
    IStatusTracking2,
    IUser,
} from "@repo/interfaces";
import MetricRepository from "@/repositories/implementations/mongodb/metricRepository";
import {
    findMatchResultsByDateRange,
    findMatchResultsByDateRange2,
    getMatchResultsModel,
} from "@repo/schemas";
import connectToReadOnlyProdDB from "@/db/connectToReadOnlyProdDB";
import {
    AggregationMap,
    MetricSpec,
    metricSpecsConfig,
} from "@/utils/backend/processMatchConfigUtil";
import { getGameDataApiKey } from "@/utils/environmentUtilWCA";

const MATCH_RESULT_FORMAT_CHANGE_DATE = new Date("2025-10-08T00:00:00.000Z");

async function handler(req: NextApiRequest, res: NextApiResponse, user: IUser) {
    if (req.method !== "GET") {
        sendApiResponse(res, {
            success: false,
            err: `Method ${req.method} Not Allowed`,
        });
        return;
    }

    const apiKey = req.headers["x-api-key"];
    const serverApiKey = getGameDataApiKey();

    if (!apiKey || !serverApiKey || apiKey !== serverApiKey) {
        return sendApiResponse(res, {
            success: false,
            err: "Unauthorized: Missing or Invalid API key",
        });
    }

    let readOnlyProdDB;
    try {
        // precompute metric key to metric specs
        const metricKeyToMetricSpecMap = new Map(
            metricSpecsConfig.map((ms) => [ms.key, ms])
        );

        const { startDate, endDate, keyFilters } = req.query;

        console.log(
            "req query - startDate: %s, endDate: %s, keyFilters: %s",
            startDate,
            endDate,
            keyFilters
        );

        let start: Date;
        let end: Date;

        if (startDate && endDate) {
            // startDate and endDate provided, date range from startDate to endDate
            start = new Date(startDate as string);
            start.setUTCHours(0, 0, 0, 0);
            end = new Date(endDate as string);
            end.setUTCHours(0, 0, 0, 0);
        } else if (startDate) {
            // startDate provided, range from startDate to today midnight
            start = new Date(startDate as string);
            start.setUTCHours(0, 0, 0, 0);
            const today = new Date();
            end = new Date(today.setUTCHours(0, 0, 0, 0));
        } else {
            // default to yesterday midnight to today midnight
            const today = new Date();
            end = new Date(today.setUTCHours(0, 0, 0, 0));
            start = new Date(end);
            start.setDate(start.getUTCDate() - 1);
        }

        const formattedKeyFilters: string[] = Array.isArray(keyFilters)
            ? keyFilters
            : keyFilters
            ? [keyFilters]
            : [];

        console.log(
            "sanitize params - startDate: %s, endDate: %s, keyFilters: %s",
            start,
            end,
            formattedKeyFilters
        );
        let updatedMetricSpecsConfig = metricSpecsConfig;
        // key filter is provided, get list of filter keys otherwise use default specs
        if (formattedKeyFilters.length > 0) {
            updatedMetricSpecsConfig = metricSpecsConfig.filter(
                (metricSpec) => {
                    return formattedKeyFilters.includes(metricSpec.key);
                }
            );
            console.log(
                "Updated metrics config against key filters",
                updatedMetricSpecsConfig
            );
        }

        readOnlyProdDB = await connectToReadOnlyProdDB();
        const prodMatchResultsModel = getMatchResultsModel(readOnlyProdDB);
        const prodMatchResultsModelV2 =
            prodMatchResultsModel as unknown as Model<IMatchResults2>;

        const pageSize = 500; // number of docs per batch
        const filteredMatchResults: IMatchResults[] = [];
        const formatChangeTime =
            MATCH_RESULT_FORMAT_CHANGE_DATE.getTime();

        if (start.getTime() < formatChangeTime) {
            const legacyEndTime = Math.min(
                end.getTime(),
                formatChangeTime - 1
            );

            if (legacyEndTime >= start.getTime()) {
                const legacyEndDate = new Date(legacyEndTime);
                let legacyPage = 0;

                while (true) {
                    const batchMatchResults =
                        await findMatchResultsByDateRange(
                            prodMatchResultsModel,
                            start,
                            legacyEndDate,
                            pageSize,
                            legacyPage * pageSize
                        );

                    if (!batchMatchResults.length) {
                        break; // exit if no more results
                    }

                    filteredMatchResults.push(...batchMatchResults);
                    legacyPage++;
                }
            }
        }

        if (end.getTime() >= formatChangeTime) {
            const modernStartTime = Math.max(
                start.getTime(),
                formatChangeTime
            );

            if (modernStartTime <= end.getTime()) {
                const modernStartDate = new Date(modernStartTime);
                let modernPage = 0;

                while (true) {
                    const batchMatchResults2 =
                        await findMatchResultsByDateRange2(
                            prodMatchResultsModelV2,
                            modernStartDate,
                            end,
                            pageSize,
                            modernPage * pageSize
                        );

                    if (!batchMatchResults2.length) {
                        break; // exit if no more results
                    }

                    filteredMatchResults.push(
                        ...batchMatchResults2.map(
                            convertMatchResults2ToMatchResults
                        )
                    );
                    modernPage++;
                }
            }
        }

        filteredMatchResults.sort((a, b) => {
            const aDate =
                a.createdAt ??
                new Date(0);
            const bDate =
                b.createdAt ??
                new Date(0);

            return (
                new Date(aDate).getTime() - new Date(bDate).getTime()
            );
        });

        console.log(
            filteredMatchResults.length,
            "records pulled from match results collection"
        );

        // view -> { metricKey: { [day]: { sum, count, matchCount } } }
        const aggregationMap: AggregationMap = {};
        for (const match of filteredMatchResults) {
            aggregateMatch(match, updatedMetricSpecsConfig, aggregationMap);
        }

        // flatten to IMetric[]
        const metrics: IMetric[] = transformAggregationMap(
            metricKeyToMetricSpecMap,
            aggregationMap
        );

        // chunk size to save into MongoDB
        batchStoreMetrics(metrics);

        console.log(`Successfully batch store ${metrics.length} metrics`);

        // close read only prod db
        await readOnlyProdDB.close();
        console.log(
            `Read Only Prod DB connection is ${
                readOnlyProdDB.readyState === 0 ? "closed" : "open"
            }`
        );

        sendApiResponse(res, { success: true });
    } catch (e: any) {
        if (readOnlyProdDB && readOnlyProdDB.readyState !== 0) {
            await readOnlyProdDB.close();
            console.log("Read Only Prod DB connection closed");
        }
        console.error("Error processing matches", e);
        sendApiResponse(res, {
            success: false,
            err: `Error processing matches ${e.message}`,
        });
    }
}

function aggregateMatch(
    match: IMatchResults,
    metricSpecs: MetricSpec[],
    aggregationMap: AggregationMap
) {
    const createdAt = match.createdAt;
    const day = createdAt?.toISOString().split("T")[0];

    if (!day) {
        console.log('day is undefined!')
        return;
    }

    for (const metricSpec of metricSpecs) {
        let usedInThisMatch = 0;
        if (
            metricSpec.championId ||
            metricSpec.wildcardId ||
            metricSpec.summonCardId
        ) {
            // champion based metric (iterate players): avg chamption damage and avg use rate
            // wildcard based metric (iterate players): avg wildcard usage
            // summon based metric (iterate players): avg use rate
            for (const playerData of match.matchResults.playerData) {
                // Skip if not corresponding champion or wildcard
                if (
                    metricSpec.championId &&
                    playerData.loadout.championId.toLowerCase() !==
                        metricSpec.championId.toLowerCase() &&
                    metricSpec.metricType !== "useRate"
                ) {
                    continue;
                }

                if (
                    metricSpec.wildcardId &&
                    !playerData.loadout.wildCardIds.includes(
                        metricSpec.wildcardId
                    ) &&
                    metricSpec.metricType !== "useRate"
                ) {
                    continue;
                }

                if (
                    metricSpec.summonCardId &&
                    !playerData.loadout.summonCardIds.includes(
                        metricSpec.summonCardId
                    ) &&
                    metricSpec.metricType !== "useRate"
                ) {
                    continue;
                }

                const val = metricSpec.extractor(match, playerData);
                if (val === null) {
                    continue;
                }

                aggregationMap[metricSpec.key] ??= {};
                aggregationMap[metricSpec.key][day] ??= {
                    sum: 0,
                    count: 0,
                    matchCount: 0,
                };
                if (metricSpec.metricType === "average") {
                    aggregationMap[metricSpec.key][day].sum += val;
                    aggregationMap[metricSpec.key][day].count += 1;
                } else if (metricSpec.metricType === "useRate") {
                    usedInThisMatch += val;
                }
            }

            // lastly update aggregation if metric type is "useRate"
            if (metricSpec.metricType === "useRate") {
                // num of players using champion or using wildcard
                aggregationMap[metricSpec.key][day].count += usedInThisMatch;
                aggregationMap[metricSpec.key][day].matchCount += 1;
            }
        } else {
            // match level metric: avg duration and avg overtime
            const val = metricSpec.extractor(match);
            if (val === null) {
                continue;
            }

            aggregationMap[metricSpec.key] ??= {};
            aggregationMap[metricSpec.key][day] ??= {
                sum: 0,
                count: 0,
                matchCount: 0,
            };

            if (metricSpec.metricType === "average") {
                aggregationMap[metricSpec.key][day].sum += val;
                aggregationMap[metricSpec.key][day].count += 1;
            } else if (metricSpec.metricType === "raw") {
                // get raw rolling sum
                aggregationMap[metricSpec.key][day].sum += val;
            }
        }
    }
}

function convertMatchResults2ToMatchResults(
    matchResults2: IMatchResults2
): IMatchResults {
    const { matchResults, _id, __v, createdAt, updatedAt } = matchResults2;
    const normalizedCreatedAt = normalizeDate(
        createdAt,
        createdAt ?? MATCH_RESULT_FORMAT_CHANGE_DATE
    );

    return {
        _id,
        __v,
        createdAt,
        updatedAt,
        matchResults: {
            lobbyId: matchResults?.lid ?? "",
            playerData: (matchResults?.pd ?? []).map(
                mapPlayerData2ToPlayerData
            ),
            winningTeamId: matchResults?.wt ?? "",
            duration: matchResults?.d ?? 0,
            eventId: matchResults?.eid ?? "",
            matchId: matchResults?.mid ?? "",
            gameTypeId: matchResults?.gt ?? "",
            createdAt: normalizedCreatedAt,
        },
    };
}

function mapPlayerData2ToPlayerData(player: IPlayerData2): IPlayerData {
    return {
        gamerTag: player.gt ?? "",
        teamId: player.t ?? 0,
        loadout: mapLoadout2ToLoadout(player.l),
        castCards: (player.c ?? []).map(mapCastCard2ToCastCard),
        kos: player.kos ?? 0,
        totalDamageDone: player.tdi ?? 0,
        totalDamageReceived: player.tdr ?? 0,
        totalHealingInflicted: player.thi ?? 0,
        totalHealingReceived: player.thr ?? 0,
        knockedouts: player.koi ?? 0,
        summonKOs: player.sko ?? 0,
        goalieKOs: player.gko ?? 0,
        sidekicksSpawned: player.ss ?? 0,
        healthCollected: player.hs ?? "",
        manaCollected: player.mc ?? "",
        damageTracking: mapDamageTracking2ToDamageTracking(player.dt),
        statusTracking: mapStatusTracking2ToStatusTracking(player.st),
        totalWildcardsAcquired: player.wca ?? "",
    };
}

function mapLoadout2ToLoadout(loadout?: ILoadout2): ILoadout {
    return {
        _id: loadout?._id ?? "",
        championId: loadout?.c ?? "",
        name: loadout?.n ?? "",
        summonCardIds: loadout?.s ?? [],
        talentCardIds: loadout?.t ?? [],
        wildCardIds: loadout?.w ?? [],
        cosmeticCardIds: loadout?.cos ?? [],
        equippedCosmetics: loadout?.eq ?? {},
        IsDefault: loadout?.IsDefault ?? false,
    };
}

function mapCastCard2ToCastCard(castCard: ICastCard2): ICastCard {
    return {
        _id: castCard?._id ?? "",
        casts: castCard?.c ?? 0,
    };
}

function mapDamageTracking2ToDamageTracking(
    damageTracking?: IDamageTracking2
): IDamageTracking {
    return {
        physicalDamageInflicted: damageTracking?.pdi ?? "",
        physicalDamageReceived: damageTracking?.pdr ?? "",
        fireDamageInflicted: damageTracking?.fdi ?? "",
        fireDamageReceived: damageTracking?.fdr ?? "",
        poisonDamageInflicted:
            damageTracking?.poisonDamageInflicted ?? "",
        poisonDamageReceived:
            damageTracking?.poisonDamageReceived ?? "",
        shockDamageInflicted: damageTracking?.kdi ?? "",
        shockDamageReceived: damageTracking?.kdr ?? "",
        sonicDamageInflicted:
            damageTracking?.sonicDamageInflicted ?? "",
        sonicDamageReceived:
            damageTracking?.sonicDamageReceived ?? "",
    };
}

function mapStatusTracking2ToStatusTracking(
    statusTracking?: IStatusTracking2
): IStatusTracking {
    return {
        knockbackStatusInflicted: statusTracking?.kbi ?? "",
        knockbackStatusReceived: statusTracking?.kbr ?? "",
        tauntStatusInflicted: statusTracking?.ti ?? "",
        tauntStatusReceived: statusTracking?.tr ?? "",
        hasteStatusInflicted: statusTracking?.hi ?? "",
        hasteStatusReceived: statusTracking?.hr ?? "",
        slowStatusInflicted: statusTracking?.si ?? "",
        slowStatusReceived: statusTracking?.sr ?? "",
        hackStatusInflicted: statusTracking?.hai ?? "",
        hackStatusReceived: statusTracking?.har ?? "",
    };
}

function normalizeDate(
    value: Date | string | undefined,
    fallback: Date
): Date {
    if (!value) {
        return new Date(fallback);
    }

    if (value instanceof Date) {
        return value;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date(fallback) : parsed;
}

function transformAggregationMap(
    metricSpecMap: Map<string, MetricSpec>,
    aggregationMap: AggregationMap
) {
    return Object.entries(aggregationMap).flatMap(([key, byDay]) => {
        const metricSpec = metricSpecMap.get(key);
        if (!metricSpec) {
            return [];
        }

        return Object.entries(byDay).map(
            ([day, { sum, count, matchCount }]) => {
                let value: number;

                switch (metricSpec.metricType) {
                    case "average":
                        value = count > 0 ? sum / count : 0;
                        break;
                    case "useRate":
                        value = matchCount > 0 ? count / (matchCount * 4) : 0;
                        break;
                    case "raw":
                        value = sum;
                        break;
                    default:
                        value = 0;
                }

                return {
                    timestamp: new Date(day),
                    key,
                    value: Math.round(value * 100) / 100,
                    category: metricSpec.category,
                };
            }
        );
    });
}

async function batchStoreMetrics(metrics: IMetric[]) {
    const metricRepository = new MetricRepository();
    const batchSize = 1000;
    for (let i = 0; i < metrics.length; i += batchSize) {
        const metricBatch = metrics.slice(i, i + batchSize);
        metricRepository.insertManyMetrics(metricBatch);
    }
}

export default handler;
