using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models
{
    public class ChannelEntranceMessage
    {
        public string FanID { get; set; } = "";
        public string FanName { get; set; } = "";
        public string FanPfpUrl { get; set; } = "";
        public Boolean HasWalletAddress { get; set; } = false;
        public int SeatSectionNumber { get; set; } = 0;
        public int SeatScore { get; set; } = 0;
        public long Timestamp { get; set; } = 0;
    }
}
