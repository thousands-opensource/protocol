using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.Boost;
using IvsIdleGameShared.Models.Leaderboard;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Services.Interfaces;

namespace IvsIdleGameShared.Services.Implementations
{
    public class LeaderboardService : ILeaderboardService
    {
        private readonly ILeaderboardRepository _leaderboardRepository;
        private readonly IFanVisibilityService _fanVisibilityService;

        public LeaderboardService(ILeaderboardRepository leaderboardRepository,
            IFanVisibilityService fanVisibilityService)
        {
            _leaderboardRepository = leaderboardRepository;
            _fanVisibilityService = fanVisibilityService;
        }

        public async Task<List<UserScore>> GetAllScores(string eventId)
        {
            var allUserScores = await _leaderboardRepository.GetAllScores(eventId);

            return allUserScores;
        }

        public async Task<ChatLeaderboard> GetScores(string eventId, string vendorEventId, string userId)
        {
            ChatLeaderboard leaderBoard = new ChatLeaderboard()
            {
                CurrentUserId = userId
            };

            var topThreeUserScores = await _leaderboardRepository.GetTopThreeUserScores(eventId);

            foreach (var topThreeUserScore in topThreeUserScores)
            {
                string fanId = topThreeUserScore.UserId;
                var fanInTheStands = await _fanVisibilityService.GetFanInTheStands(vendorEventId, fanId);

                if (fanInTheStands != null)
                {
                    Console.WriteLine(JsonSerializer.Serialize(fanInTheStands));
                }
                else
                {
                    Console.WriteLine($"topThreeUserScore - Unable to get fan in the stand: {fanId}");
                }

                Leader newLeader = new Leader()
                {
                    Rank = topThreeUserScore.Rank,
                    UserId = topThreeUserScore.UserId,
                };

                leaderBoard.Leaders.Add(newLeader);
            }

            var threeUserScoresAroundUser = await _leaderboardRepository.GetThreeScoresAroundUser(eventId, userId);

            foreach (var scoreAroundUser in threeUserScoresAroundUser)
            {
                //This user is the currentUser, so get the rank
                if (scoreAroundUser.UserId == userId)
                {
                    leaderBoard.CurrentUserRank = scoreAroundUser.Rank;
                }

                string fanId = scoreAroundUser.UserId;
                var fanInTheStands = await _fanVisibilityService.GetFanInTheStands(vendorEventId, fanId);

                if (fanInTheStands != null)
                {
                    Console.WriteLine(JsonSerializer.Serialize(fanInTheStands));
                }
                else
                {
                    Console.WriteLine($"scoreAroundUser - Unable to get fan in the stand: {fanId}");
                }

                Leader newLeader = new Leader()
                {
                    Rank = scoreAroundUser.Rank,
                    UserId = scoreAroundUser.UserId,
                };

                leaderBoard.Leaders.Add(newLeader);
            }

            return leaderBoard;
        }

        public async Task IncrementScore(string eventId, string userId, int incrementAmount)
        {
            int updatedScore =
                (int)await _leaderboardRepository.IncrementUserIdToScoreMappingSortedSet(eventId, userId,
                    incrementAmount);
        }

        public async Task IncrementScores(string eventId, List<Boost> boosts)
        {
            await _leaderboardRepository.IncrementUserIdsToScoresMappingSortedSet(eventId, boosts);
        }
    }
}
