using System.Text.Json.Serialization;

namespace IvsIdleGameShared.Models
{
    public class SignalToStreamOverlay
    {
        [JsonPropertyName("overlayName")]
        public string OverlayName { get; set; } = String.Empty;

        [JsonPropertyName("voteQuestionText")]
        public string VoteQuestionText { get; set; } = String.Empty;

        [JsonPropertyName("optionAText")]
        public string OptionAText { get; set; } = String.Empty;

        [JsonPropertyName("optionBText")]
        public string OptionBText { get; set; } = String.Empty;

        [JsonPropertyName("totalVoteCount")]
        public int TotalVoteCount { get; set; } = 0;

        [JsonPropertyName("optionAVoteCount")]
        public int OptionAVoteCount { get; set; } = 0;

        [JsonPropertyName("optionBVoteCount")]
        public int OptionBVoteCount { get; set; } = 0;

        [JsonPropertyName("finalText")]
        public string FinalText { get; set; } = String.Empty;

        [JsonPropertyName("textOptions")]
        public string[]? TextOptions { get; set; } = null;

        [JsonPropertyName("textOptionsWithVoteCounts")]
        public TextOptionWithVoteCount[]? TextOptionsWithVoteCount { get; set; } = null;

        [JsonPropertyName("lastWager")]
        public TextOptionWithVoteCount? LastWager { get; set; } = null;
    }
}
