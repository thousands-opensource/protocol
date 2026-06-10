using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using IvsIdleGameShared.Models.Metagame;

namespace IvsIdleGameShared.Repositories.Interfaces
{
    public interface ICardPackRepository
    {
        Task<bool> AddCardPack(CardPack cardPack);


        Task<bool> IncrementCardPackVaultAmount(int houseId, decimal amountToIncrement);
    }
}
