using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models.ExternalStreams
{
    public class GetViewCountRequest
    {
        [JsonPropertyName("userIds")] public List<string> UserIds { get; set; } = new List<string>();
    }
}
