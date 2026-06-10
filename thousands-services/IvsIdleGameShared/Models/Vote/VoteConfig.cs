using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Vote
{
    public class VoteConfig
    {
        [JsonPropertyName("voteTitle")]
        public string VoteTitle { get; set; } = "";

        [JsonPropertyName("voteTimeSeconds")]
        public int VoteTimeSeconds { get; set; } = 60;

        [JsonPropertyName("voteStartTimestamp")]
        public long VoteStartTimestamp { get; set; } = 0;

        [JsonPropertyName("voteOptions")]
        public List<string> VoteOptions { get; set; } = new List<string>();
    }
}
