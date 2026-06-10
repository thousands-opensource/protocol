using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.Vote
{
    public class VoteOptionWithVotes
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = "";

        [JsonPropertyName("numberOfVotes")]
        public int NumberOfVotes { get; set; } = 0;
    }
}
