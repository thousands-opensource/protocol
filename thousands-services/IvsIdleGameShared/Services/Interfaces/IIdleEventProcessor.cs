using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using IvsIdleGameShared.Models;

namespace IvsIdleGameShared.Services.Interfaces
{
    public interface IIdleEventProcessor
    {
        decimal CalculatePersonalCreditsFromEvents(long currentTimestamp, List<IdleEvent> idleEvents,
            ref decimal rolledUpCredits, ref List<IdleEvent> eventsBeingRemoved);
    }
}
