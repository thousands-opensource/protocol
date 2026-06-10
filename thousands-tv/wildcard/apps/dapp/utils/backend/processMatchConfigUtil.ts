import { IMatchResults, IPlayerData } from "@repo/interfaces";
export type MetricType = "useRate" | "average" | "raw";
export type MetricSpec = {
    key: string;
    championId?: string; // specific champion item
    wildcardId?: string; // specific wildcard item
    summonCardId?: string; // specific summon item
    extractor: (
        match: IMatchResults,
        playerData?: IPlayerData
    ) => number | null;
    metricType: MetricType;
    category: string; // totalDamage, kos, matchDuration
};

export type AggregationMap = Record<
    string,
    Record<
        string,
        {
            sum: number;
            count: number;
            matchCount: number;
        }
    >
>;

// Backend Configuration for Metrics
export const metricSpecsConfig: MetricSpec[] = [
    {
        key: "matchDurationAvg",
        metricType: "average",
        category: "matchDuration",
        extractor: (match) => match.matchResults.duration,
    },
    {
        key: "bolgarAvgTotalDamage",
        championId: "items.c.c.Bolgar",
        metricType: "average",
        category: "championTotalDamage",
        extractor: (match: IMatchResults, playerData?: IPlayerData) =>
            playerData?.totalDamageDone ?? null,
    },
    {
        key: "ragnaAvgTotalDamage",
        championId: "items.c.c.Ragna",
        metricType: "average",
        category: "championTotalDamage",
        extractor: (match: IMatchResults, playerData?: IPlayerData) =>
            playerData?.totalDamageDone ?? null,
    },
    {
        key: "nevaAvgTotalDamage",
        championId: "items.c.c.Neva",
        metricType: "average",
        category: "championTotalDamage",
        extractor: (match: IMatchResults, playerData?: IPlayerData) =>
            playerData?.totalDamageDone ?? null,
    },
    {
        key: "lockeAvgTotalDamage",
        championId: "items.c.c.Locke",
        metricType: "average",
        category: "championTotalDamage",
        extractor: (match: IMatchResults, playerData?: IPlayerData) =>
            playerData?.totalDamageDone ?? null,
    },
    {
        key: "bolgarAvgUseRate",
        championId: "items.c.c.Bolgar",
        metricType: "useRate",
        category: "championUseRate",
        extractor: (match: IMatchResults, playerData?: IPlayerData) =>
            playerData?.loadout.championId.toLowerCase() ===
            "items.c.c.Bolgar".toLowerCase()
                ? 1
                : 0,
    },
    {
        key: "ragnaAvgUseRate",
        championId: "items.c.c.Ragna",
        metricType: "useRate",
        category: "championUseRate",
        extractor: (match: IMatchResults, playerData?: IPlayerData) =>
            playerData?.loadout.championId.toLowerCase() ===
            "items.c.c.Ragna".toLowerCase()
                ? 1
                : 0,
    },
    {
        key: "nevaAvgUseRate",
        championId: "items.c.c.Neva",
        metricType: "useRate",
        category: "championUseRate",
        extractor: (match: IMatchResults, playerData?: IPlayerData) =>
            playerData?.loadout.championId.toLowerCase() ===
            "items.c.c.Neva".toLowerCase()
                ? 1
                : 0,
    },
    {
        key: "lockeAvgUseRate",
        championId: "items.c.c.Locke",
        metricType: "useRate",
        category: "championUseRate",
        extractor: (match: IMatchResults, playerData?: IPlayerData) =>
            playerData?.loadout.championId.toLowerCase() ===
            "items.c.c.Locke".toLowerCase()
                ? 1
                : 0,
    },
    {
        key: "overtimeAvgRate",
        metricType: "average",
        category: "matchOvertime",
        extractor: (match: IMatchResults) =>
            match.matchResults.duration > 600 ? 1 : 0,
    },
    {
        key: "impactFuryAvgUseRate",
        wildcardId: "items.c.w.ImpactFury",
        metricType: "useRate",
        category: "wildcardUseRate",
        extractor: (match: IMatchResults, playerData?: IPlayerData) =>
            playerData?.loadout.wildCardIds.includes("items.c.w.ImpactFury")
                ? 1
                : 0,
    },
    {
        key: "cooldownReductionAvgUseRate",
        wildcardId: "items.c.w.CooldownReduction",
        metricType: "useRate",
        category: "wildcardUseRate",
        extractor: (match: IMatchResults, playerData?: IPlayerData) =>
            playerData?.loadout.wildCardIds.includes(
                "items.c.w.CooldownReduction"
            )
                ? 1
                : 0,
    },
    {
        key: "matchesPlayedAvg",
        metricType: "raw",
        category: "matchesPlayed",
        extractor: (match: IMatchResults, playerData?: IPlayerData) =>
            match ? 1 : 0,
    },
    {
        key: "gorritAvgUseRate",
        summonCardId: "items.c.s.Gorrit",
        metricType: "useRate",
        category: "summonCardUseRate",
        extractor: (match: IMatchResults, playerData?: IPlayerData) =>
            playerData?.loadout.summonCardIds.includes("items.c.s.Gorrit")
                ? 1
                : 0,
    },
    {
        key: "aloeAvgUseRate",
        summonCardId: "items.c.s.Aloe",
        metricType: "useRate",
        category: "summonCardUseRate",
        extractor: (match: IMatchResults, playerData?: IPlayerData) =>
            playerData?.loadout.summonCardIds.includes("items.c.s.Aloe")
                ? 1
                : 0,
    },
    {
        key: "chonkAvgUseRate",
        summonCardId: "items.c.s.Chonk",
        metricType: "useRate",
        category: "summonCardUseRate",
        extractor: (match: IMatchResults, playerData?: IPlayerData) =>
            playerData?.loadout.summonCardIds.includes("items.c.s.Chonk")
                ? 1
                : 0,
    },
    {
        key: "buckshotAvgUseRate",
        summonCardId: "items.c.s.DeerArcher",
        metricType: "useRate",
        category: "summonCardUseRate",
        extractor: (match: IMatchResults, playerData?: IPlayerData) =>
            playerData?.loadout.summonCardIds.includes("items.c.s.DeerArcher")
                ? 1
                : 0,
    },
    {
        key: "infernusAvgUseRate",
        summonCardId: "items.c.s.FireMonsterKing",
        metricType: "useRate",
        category: "summonCardUseRate",
        extractor: (match: IMatchResults, playerData?: IPlayerData) =>
            playerData?.loadout.summonCardIds.includes("items.c.s.FireMonsterKing")
                ? 1
                : 0,
    },
    {
        key: "goalieKosAvg",
        metricType: "average",
        category: "allChampionGoalieKos",
        extractor: (match: IMatchResults, playerData?: IPlayerData) =>
            match.matchResults.playerData.reduce((rollingSum, pd) => {
                return rollingSum + (pd.goalieKOs ?? 0);
            }, 0),
    },
];
