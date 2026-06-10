export const MAX_DAYS = 60;
export const MAX_NUM_CATEGORY_CHARTS = 4;
export const MAX_NUM_KEY_INDICATORS_SELECTION = 4;

export type Category = {
    label: string; // name of the category
    delimiter: string; // delimiter to remove "Avg"
    keyIndicators: string | string[]; // has to match processMatchConfigUtil.ts
    format: "wide" | "long"; // wide: many data points or long: single data point
    yAxisOptionalText?: string; // provide optional text in the legend
};

// Front End: Category Config Chart
export const categoryConfigMap: Record<string, Category> = {
    // Long format
    matchDuration: {
        label: "Match Duration",
        delimiter: "Avg",
        keyIndicators: "matchDurationAvg",
        format: "long",
        yAxisOptionalText: "seconds",
    },
    matchOvertime: {
        label: "Match Overtime Rate",
        delimiter: "AvgRate",
        keyIndicators: "overtimeAvgRate",
        format: "long",
        yAxisOptionalText: "",
    },
    matchesPlayed: {
        label: "Matches Played",
        delimiter: "Avg",
        keyIndicators: "matchesPlayedAvg",
        format: "long",
        yAxisOptionalText: "played",
    },
    allChampionGoalieKos: {
        // special ones*
        label: "Goalie KOs",
        delimiter: "Avg",
        keyIndicators: "goalieKosAvg",
        format: "long",
        yAxisOptionalText: "",
    },

    // Wide format
    championTotalDamage: {
        label: "Champion Damage",
        delimiter: "AvgTotalDamage",
        keyIndicators: [
            "nevaAvgTotalDamage",
            "lockeAvgTotalDamage",
            "ragnaAvgTotalDamage",
            "bolgarAvgTotalDamage",
        ],
        format: "wide",
        yAxisOptionalText: "damage",
    },
    championUseRate: {
        label: "Champion Use Rate",
        delimiter: "AvgUseRate",
        keyIndicators: [
            "bolgarAvgUseRate",
            "ragnaAvgUseRate",
            "nevaAvgUseRate",
            "lockeAvgUseRate",
        ],
        format: "wide",
        yAxisOptionalText: "use rate",
    },
    // summonsTotalDamage: {
    //     label: "Summons Total Damage",
    //     delimiter: "AvgTotalDamageDone",
    //     keyIndicators: [],
    //     format: "wide",
    //     yAxisOptionalText: "damage",
    // },
    wildcardUseRate: {
        label: "Wildcard Use Rate",
        delimiter: "AvgUseRate",
        keyIndicators: ["impactFuryAvgUseRate", "cooldownReductionAvgUseRate"],
        format: "wide",
        yAxisOptionalText: "use rate",
    },
    summonCardUseRate: {
        label: "Summons Use Rate",
        delimiter: "AvgUseRate",
        keyIndicators: ["aloeAvgUseRate", "buckshotAvgUseRate", "chonkAvgUseRate", "gorritAvgUseRate", "infernusAvgUseRate"],
        format: "wide",
        yAxisOptionalText: "use rate",
    },
};

// list of categorical charts
export const CATEGORIES = Object.keys(categoryConfigMap);

export const fallBackKeyIndicatorColor = "#ff0000";
export const keyIndicatorsToColorMap: Record<string, string> = {
    // Matches
    matchesPlayedAvg: "#4d13f0",
    matchDurationAvg: "#8884d8",
    overtimeAvgRate: "#28ff73",
    goalieKosAvg: "#9d73ff",

    // Champion
    nevaAvgTotalDamage: "#2cbfbf",
    lockeAvgTotalDamage: "#ffc000",
    ragnaAvgTotalDamage: "#e70015",
    bolgarAvgTotalDamage: "#35cd00",
    nevaAvgUseRate: "#2cbfbf",
    lockeAvgUseRate: "#ffc000",
    ragnaAvgUseRate: "#e70015",
    bolgarAvgUseRate: "#35cd00",

    // Summons
    aloeAvgUseRate: "#accd50",
    buckshotAvgUseRate: "#5c9b02",
    chonkAvgUseRate: "#27826c",
    gorritAvgUseRate: "#b57a3c",
    infernusAvgUseRate: "#dc2513",

    // Wilcard
    impactFuryAvgUseRate: "#d33f00ff",
    cooldownReductionAvgUseRate: "#73ff37",
};

export interface KeyIndicatorOption {
    value: string;
    label: string;
    color: string;
}

// export interface IMatchDoc {
//     _id: { oid: string };
//     matchResults: IMatchResults;
//     createdAt: { $date: string };
// }

// export interface IMatchResults {
//     lobbyId: string;
//     playerData: IPlayerData[];
//     winningTeamId: { $numberLong: string };
//     duration: number;
//     eventId: string;
//     matchId: string;
//     gameTypeId: string;
//     createdAt: { $date: string };
// }

// export interface IPlayerData {
//     gamerTag: { $numberLong: string };
//     teamId: number;
//     loadout: ILoadout;
//     castCards: ICastCard[];
//     kos: number;
//     totalDamageDone: number;
//     totalDamageReceived: number;
//     totalHealingInflicted: number;
//     totalHealingReceived: number;
//     knockedouts: number;
//     summonKOs: number;
//     goalieKOs: number;
//     sidekicksSpawned: number;
//     healthCollected: { $numberLong: string };
//     manaCollected: { $numberLong: string };
//     damageTracking: IDamageTracking;
//     statusTracking: IStatusTracking;
//     totalWildcardsAcquired: { $numberLong: string };
// }

// export interface ILoadout {
//     _id: string;
//     championId: string;
//     name: string;
//     summonCardIds: string[];
//     talentCardIds: string[];
//     wildCardIds: string[];
//     cosmeticCardIds: string[];
//     equippedCosmetics: Record<string, any>;
//     IsDefault: boolean;
// }

// export interface ICastCard {
//     _id: string;
//     casts: number;
// }

// export interface IDamageTracking {
//     physicalDamageInflicted: { $numberLong: string };
//     physicalDamageReceived: { $numberLong: string };
//     fireDamageInflicted: { $numberLong: string };
//     fireDamageReceived: { $numberLong: string };
//     poisonDamageInflicted: { $numberLong: string };
//     poisonDamageReceived: { $numberLong: string };
//     shockDamageInflicted: { $numberLong: string };
//     shockDamageReceived: { $numberLong: string };
//     sonicDamageInflicted: { $numberLong: string };
//     sonicDamageReceived: { $numberLong: string };
// }

// export interface IStatusTracking {
//     knockbackStatusInflicted: { $numberLong: string };
//     knockbackStatusReceived: { $numberLong: string };
//     tauntStatusInflicted: { $numberLong: string };
//     tauntStatusReceived: { $numberLong: string };
//     hasteStatusInflicted: { $numberLong: string };
//     hasteStatusReceived: { $numberLong: string };
//     slowStatusInflicted: { $numberLong: string };
//     slowStatusReceived: { $numberLong: string };
//     hackStatusInflicted: { $numberLong: string };
//     hackStatusReceived: { $numberLong: string };
// }
