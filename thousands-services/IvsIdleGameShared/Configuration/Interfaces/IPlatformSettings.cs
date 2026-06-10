using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Configuration.Interfaces
{
    public interface IPlatformSettings
    {
        public string? ThousandsApiRootUrl { get; set; }
        public string? FetchFanDetailsUrl { get; set; }
        public string? PlatformXApiKey { get; set; }
    }
}
