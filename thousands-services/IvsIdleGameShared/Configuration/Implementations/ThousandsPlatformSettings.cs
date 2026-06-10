using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using IvsIdleGameShared.Configuration.Interfaces;

namespace IvsIdleGameShared.Configuration.Implementations
{
    public class ThousandsPlatformSettings : IPlatformSettings
    {
        public string? ThousandsApiRootUrl { get; set; }
        public string? FetchFanDetailsUrl { get; set; }
        public string? PlatformXApiKey { get; set; }
    }
}
