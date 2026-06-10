using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Models
{
    public class TextOptionWithVoteCount
    {
        public string TextOption { get; set; } = string.Empty;
        public int VoteCount { get; set;} = 0;
    }
}
