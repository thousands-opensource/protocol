using IvsIdleGameShared.Models;
using IvsIdleGameShared.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IvsIdleGameShared.Services.Implementations
{
    public class IdleEventProcessor : IIdleEventProcessor
    {
        public decimal CalculatePersonalCreditsFromEvents(long currentTimestamp, List<IdleEvent> idleEvents, ref decimal rolledUpCredits, ref List<IdleEvent> eventsBeingRemoved)
        {
            decimal score = 0;
            decimal creditAddedByEventsBeingRemoved = 0;
            decimal creditAddedByThisEvent = 0;
            int secondsEventHasBeenActive = 0;
            foreach (var idleEvent in idleEvents)
            {
                creditAddedByThisEvent = 0;
                secondsEventHasBeenActive = (int)((currentTimestamp - idleEvent.Timestamp) / 1000);

                score -= idleEvent.Cost;
                if (idleEvent.Duration == -1)
                {
                    creditAddedByThisEvent = idleEvent.PerTick * secondsEventHasBeenActive;
                }
                else
                {
                    creditAddedByThisEvent = idleEvent.PerTick * Math.Min(secondsEventHasBeenActive, idleEvent.Duration);
                }

                score += creditAddedByThisEvent;

                //This event is expiring
                if (idleEvent.Duration >= 0 && secondsEventHasBeenActive > idleEvent.Duration)
                {
                    creditAddedByEventsBeingRemoved += creditAddedByThisEvent;

                    if (idleEvent.IsPersonalEvent)
                    {
                        creditAddedByEventsBeingRemoved -= idleEvent.Cost;
                    }

                    eventsBeingRemoved.Add(idleEvent);
                }
            }

            rolledUpCredits = creditAddedByEventsBeingRemoved;

            return score;
        }
    }
}
