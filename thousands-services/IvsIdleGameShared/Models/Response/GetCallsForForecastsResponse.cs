using IvsIdleGameShared.Models.Chat;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization.Metadata;
using System.Threading.Tasks;
using IvsIdleGameShared.Models.RallyPrediction;

namespace IvsIdleGameShared.Models.Response
{
    public class GetCallsForForecastsResponse : DefaultResponse<List<CallWithForecast>>
    {

    }
}
