using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Vote
{
    public class VoteUpdate
    {
        [JsonPropertyName("voteTitle")]
        public string VoteTitle { get; set; } = "";

        [JsonPropertyName("voteTimeSeconds")]
        public int VoteTimeSeconds { get; set; } = 60;

        [JsonPropertyName("numberOfVotes")]
        public int NumberOfVotes { get; set; } = 0;

        [JsonPropertyName("isFinalUpdate")]
        public bool IsFinalUpdate { get; set; } = false;

        [JsonPropertyName("voteResults")]
        public List<VoteOptionWithVotes> VoteResults { get; set; } = new List<VoteOptionWithVotes>();
    }
}
