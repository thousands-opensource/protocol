namespace IvsIdleGameShared.Models
{
    public class AirDropMetadata
    {
        public string Set { get; set; } = "";
        public string Materials { get; set; } = "";
    }

    public class FanfareEffect
    {
        public string Type { get; set; } = "";
        public string Name { get; set; } = "";
        public string Value { get; set; } = "";
        public int SectionId { get; set; } = 0;
        public string SectionName { get; set; } = "";
        public int Magnitude { get; set; } = 0;
        public int Delay { get; set; } = 0;
        public int Duration { get; set; } = 0;
        public bool Notify { get; set; } = false;
        public AirDropMetadata? Metadata { get; set; }

    }
}
