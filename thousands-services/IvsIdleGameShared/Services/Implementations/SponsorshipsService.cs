using System.Data.Common;
using System.Runtime.InteropServices.Marshalling;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models;
using IvsIdleGameShared.Models.Market;
using IvsIdleGameShared.Models.Sponsorship;
using IvsIdleGameShared.Repositories.Interfaces;
using IvsIdleGameShared.Services.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;

namespace IvsIdleGameShared.Services.Implementations;

public class SponsorshipsService : ISponsorshipsService
{
    private readonly MongoClient _client;
    private readonly IMongoCollection<UserSponsoredEvent> _userSponsoredEventsCollection;
    private readonly IMongoCollection<CreditBalance> _creditBalanceCollection;
    private readonly IMongoCollection<CreditTransaction> _creditTransactionCollection;
    private readonly ISponsorshipRepository _sponsorshipRepository;

    public SponsorshipsService(IMongoDbSettings mongoDbSettings, ISponsorshipRepository sponsorshipRepository)
    {
        _client = new MongoClient(mongoDbSettings.ConnectionUri);
        IMongoDatabase database = _client.GetDatabase(mongoDbSettings.DatabaseName);
        _userSponsoredEventsCollection = database.GetCollection<UserSponsoredEvent>(mongoDbSettings.UserSponsoredEventsCollectionName);
        _creditBalanceCollection = database.GetCollection<CreditBalance>(mongoDbSettings.CreditBalanceCollectionName);
        _creditTransactionCollection = database.GetCollection<CreditTransaction>(mongoDbSettings.CreditTransactionCollectionName);
        _sponsorshipRepository = sponsorshipRepository;
    }

    public async Task<PurchaseSponsorshipResult> PurchaseSponsorship(string userId, string sponsoredEventId, string sponsorshipSlotId)
    {
        if (!ObjectId.TryParse(userId, out ObjectId userObjectId))
        {
            return new PurchaseSponsorshipResult { ErrorMessage = "Invalid userId." };
        }

        if (!ObjectId.TryParse(sponsoredEventId, out ObjectId sponsoredEventObjectId))
        {
            return new PurchaseSponsorshipResult { ErrorMessage = "Invalid sponsoredEventId." };
        }

        if (!ObjectId.TryParse(sponsorshipSlotId, out ObjectId sponsorshipSlotObjectId))
        {
            return new PurchaseSponsorshipResult { ErrorMessage = "Invalid sponsorshipSlotId." };
        }

        Console.WriteLine($"PurchaseSponsorship: userId={userId}, sponsoredEventId={sponsoredEventId}, sponsorshipSlotId={sponsorshipSlotId}");
        SponsoredEvent? sponsoredEvent = await _sponsorshipRepository.GetSponsoredEvent(sponsoredEventId);

        if (sponsoredEvent == null)
        {
            return new PurchaseSponsorshipResult { ErrorMessage = "The selected event could not be found.  Please contact support!" };
        }

        if (sponsoredEvent.SponsorshipSlots == null || sponsoredEvent.SponsorshipSlots.Count == 0)
        {
            return new PurchaseSponsorshipResult { ErrorMessage = "The selected sponsorship slot could not be found.  Please contact support!" };
        }

        SponsorshipSlot? sponsorshipSlot = sponsoredEvent.SponsorshipSlots
            .FirstOrDefault(slot => slot.SponsorshipSlotId == sponsorshipSlotObjectId);

        if (sponsorshipSlot == null)
        {
            return new PurchaseSponsorshipResult { ErrorMessage = "The selected sponsorship slot could not be found.  Please contact support!" };
        }

        if (sponsorshipSlot.CreditsPrice <= 0)
        {
            return new PurchaseSponsorshipResult { ErrorMessage = "Unable to purchase the sponsorship.  Please contact support!" };
        }

        if (sponsorshipSlot.MaxSlots > 0)
        {
            long slotsPurchased = await _sponsorshipRepository.GetUserSponsoredEventCount(
                sponsoredEventObjectId,
                sponsorshipSlotObjectId);

            if (slotsPurchased < 0)
            {
                return new PurchaseSponsorshipResult { ErrorMessage = "Unable to purchase the sponsorship.  Please contact support!" };
            }

            if (slotsPurchased >= sponsorshipSlot.MaxSlots)
            {
                return new PurchaseSponsorshipResult { ErrorMessage = "Unable to purchase the sponsorship.  This sponsorship package is sold out." };
            }
        }

        int creditBalance = await GetCreditBalance(userObjectId);
        if (creditBalance < 0)
        {
            return new PurchaseSponsorshipResult { ErrorMessage = "Unable to purchase the sponsorship.  Please contact support!" };
        }
        if (creditBalance < sponsorshipSlot.CreditsPrice)
        {
            return new PurchaseSponsorshipResult { ErrorMessage = "Unable to purchase the sponsorship.  You don't have enough credits." };
        }

        using var session = await _client.StartSessionAsync();
        session.StartTransaction();

        try
        {
            if (sponsorshipSlot.MaxSlots > 0)
            {
                long slotsPurchased = await _sponsorshipRepository.GetUserSponsoredEventCount(
                    session,
                    sponsoredEventObjectId,
                    sponsorshipSlotObjectId);

                if (slotsPurchased < 0)
                {
                    await session.AbortTransactionAsync();
                    return new PurchaseSponsorshipResult { ErrorMessage = "Unable to purchase the sponsorship.  Please contact support!" };
                }

                if (slotsPurchased >= sponsorshipSlot.MaxSlots)
                {
                    await session.AbortTransactionAsync();
                    return new PurchaseSponsorshipResult { ErrorMessage = "Unable to purchase the sponsorship.  This sponsorship package is sold out." };
                }
            }

            UserSponsoredEvent newUserSponsoredEvent = new UserSponsoredEvent
            {
                Id = ObjectId.GenerateNewId(),
                UserId = userObjectId,
                SponsoredEventId = sponsoredEventObjectId,
                SponsorshipSlotId = sponsorshipSlotObjectId,
                UsdcPrice = sponsorshipSlot.UsdcPrice,
                Tier = sponsorshipSlot.Tier,
                House = sponsorshipSlot.House,
                Support = 0,
                WcEarned = 0,
                ThousandsXpEarned = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Version = 0
            };

            await _userSponsoredEventsCollection.InsertOneAsync(session, newUserSponsoredEvent);

            CreditTransaction newCreditTransaction = new CreditTransaction()
            {
                UserId = userObjectId,
                Status = "COMPLETED",
                TransactionId = Guid.NewGuid().ToString(),
                Amount = 0 - sponsorshipSlot.CreditsPrice,
                Currency = "",
                PaymentMethod = "",
                PaymentGateway = "",
                PaymentGatewayTransactionId = null,
                RefundedAmount = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Version = 0,
                CreditType = CreditTransactionType.SPONSORSHIP_PURCHASE,
                StageId = null,
                Segment = null,
                SkyboxTier = null
            };

            await _creditTransactionCollection.InsertOneAsync(session, newCreditTransaction);

            var balanceFilter = Builders<CreditBalance>.Filter.Eq("userId", userObjectId)
                & Builders<CreditBalance>.Filter.Gte("balance", sponsorshipSlot.CreditsPrice);
            var balanceUpdate = Builders<CreditBalance>.Update
                .Set("updatedAt", DateTime.UtcNow)
                .Inc("balance", 0 - sponsorshipSlot.CreditsPrice);

            var balanceResult = await _creditBalanceCollection.UpdateOneAsync(session, balanceFilter, balanceUpdate);
            if (balanceResult.ModifiedCount < 1)
            {
                await session.AbortTransactionAsync();
                return new PurchaseSponsorshipResult { ErrorMessage = "Unable to purchase the sponsorship.  You don't have enough credits." };
            }

            await session.CommitTransactionAsync();
            return new PurchaseSponsorshipResult();
        }
        catch (Exception ex)
        {
            await session.AbortTransactionAsync();
            Console.WriteLine($"ThousandsError: Failed to purchase sponsorship - {ex.Message}");
            return new PurchaseSponsorshipResult { ErrorMessage = "Unable to purchase the sponsorship.  Please contact support!" };
        }
    }

    private async Task<int> GetCreditBalance(ObjectId userId)
    {
        try
        {
            var filter = Builders<CreditBalance>.Filter.Eq("userId", userId);
            var creditBalance = await _creditBalanceCollection.Find(filter).FirstOrDefaultAsync();
            return creditBalance?.Balance ?? 0;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ThousandsError: Failed to lookup credit balance - {ex.Message}");
            return -1;
        }
    }
}
