//This is actually the source of truth for all leaderboard meta information and we will store this each day

import {
    alphaSeriesZeroLeaderboardId,
    eventLeaderboardId,
    nftLeaderboardId,
} from "@src/constants";
import { ILeaderboard } from "@repo/interfaces";

//This way the archive will stay correct but we can change any and all values
export function getLeaderboardMetaInfo(): ILeaderboard[] {
    return [
        {
            name: "Alpha Series One",
            leaderboardId: alphaSeriesZeroLeaderboardId,
            description:
                "This leaderboard tracks general participation in social and community events that generate Wildevents",
            leaderboardRows: [],
            leaderboardScoringDetails: [
                {
                    scoringType: "signatureEventAttendance",
                    label: "signature event",
                    startDate: 0,
                    points: 250,
                },
                {
                    scoringType: "signatureEventMinutesAttended",
                    label: "signature event minutes",
                    startDate: 0,
                    points: 3,
                },
                {
                    scoringType: "playtestAttendance",
                    label: "playtest",
                    startDate: 0,
                    points: 300,
                },
                {
                    scoringType: "playtestMinutesAttended",
                    label: "playtest minutes",
                    startDate: 0,
                    points: 5,
                },
                {
                    scoringType: "communityGatheringAttendance",
                    label: "community gathering",
                    startDate: 0,
                    points: 100,
                },
                {
                    scoringType: "communityGatheringMinutesAttended",
                    label: "community gathering minutes",
                    startDate: 0,
                    points: 1,
                },
                {
                    scoringType: "kudosUltimateFan",
                    label: "kudos ultimate fan",
                    startDate: 0,
                    points: 500,
                },
                {
                    scoringType: "kudosBringTheHype",
                    label: "kudos bring the hype",
                    startDate: 0,
                    points: 200,
                },
                {
                    scoringType: "kudosLetsGetWild",
                    label: "kudos lets get wild",
                    startDate: 0,
                    points: 200,
                },
                {
                    scoringType: "kudosFanOnFire",
                    label: "kudos fan on fire",
                    startDate: 0,
                    points: 200,
                },
                {
                    scoringType: "kudosFlyItHigh",
                    label: "kudos fly it high",
                    startDate: 0,
                    points: 200,
                },
                {
                    scoringType: "kudosYouEarnedIt",
                    label: "kudos you earned it",
                    startDate: 0,
                    points: 300,
                },
                {
                    scoringType: "kudosTicketToWild",
                    label: "kudos ticket to wild",
                    startDate: 0,
                    points: 100,
                },
                {
                    scoringType: "kudosWildWin",
                    label: "kudos wild win",
                    startDate: 0,
                    points: 200,
                },
            ],
        },
        {
            name: "NFT",
            leaderboardId: nftLeaderboardId,
            description: "This leaderboard tracks NFT",
            leaderboardRows: [],
            leaderboardScoringDetails: [
                {
                    scoringType: "wildpassNftPoint",
                    label: "Points per Wildpass per Block",
                    startDate: 0,
                    points: 1,
                },
            ],
        },
        {
            name: "Event",
            leaderboardId: eventLeaderboardId,
            description:
                "This leaderboard tracks live stream interactive event",
            leaderboardRows: [],
            leaderboardScoringDetails: [
                {
                    scoringType: "eventPoint",
                    label: "Points per action",
                    startDate: 0,
                    points: 1,
                },
            ],
        },
    ];
}
