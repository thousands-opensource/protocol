using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using IvsIdleGameShared.Models;

namespace IvsIdleGameShared.Services.Interfaces
{
    public interface IFanVisibilityService
    {
        Task<List<FanInTheStands>> GetFansInTheStands(string vendorEventId);
        Task<FanInTheStands?> GetFanInTheStands(string vendorEventId, string fanId);
        Task<long> GetNumberOfGeneralAdmissionFansInTheStands(string vendorEventId);
        Task<long> GetNumberOfFansInTheStands(string vendorEventId);
        Task<bool> AddFanInTheStand(string vendorEventId, FanInTheStands fanInTheStands);
        Task<bool> RemoveFanInTheStand(string vendorEventId, string fanId);
        Task<bool> SendFanVisibilityEvent(string vendorEventId, string eventType, Object payloadObject);
    }
}
