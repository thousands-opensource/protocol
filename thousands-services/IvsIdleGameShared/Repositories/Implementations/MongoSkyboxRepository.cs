using System;
using IvsIdleGameShared.Configuration;
using IvsIdleGameShared.Models.Skybox;
using IvsIdleGameShared.Repositories.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;

namespace IvsIdleGameShared.Repositories.Implementations;

public class MongoSkyboxRepository : ISkyboxRepository
{
    private readonly IMongoCollection<Skybox> _skyboxesCollection;

    public MongoSkyboxRepository(IMongoDbSettings mongoDbSettings)
    {
        MongoClient client = new MongoClient(mongoDbSettings.ConnectionUri);
        IMongoDatabase database = client.GetDatabase(mongoDbSettings.DatabaseName);
        _skyboxesCollection = database.GetCollection<Skybox>(mongoDbSettings.SkyboxesCollectionName);
    }
    public async Task<bool> AddSkybox(Skybox skybox)
    {
        try
        {
            await _skyboxesCollection.InsertOneAsync(skybox);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"AddSkybox Error: {ex.Message}");
            return false;
        }
    }
    public async Task<bool> UpdateSkybox(Skybox skybox)
    {
        try
        {
            var filter = Builders<Skybox>.Filter.Eq(s => s.Id, skybox.Id);
            var update = Builders<Skybox>.Update
                .Set(s => s.SkyboxName, skybox.SkyboxName)
                .Set(s => s.SkyboxPrimaryColor, skybox.SkyboxPrimaryColor)
                .Set(s => s.SkyboxLogoUrl, skybox.SkyboxLogoUrl);

            await _skyboxesCollection.UpdateOneAsync(filter, update);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"UpdateSkybox Error: {ex.Message}");
            return false;
        }
    }
    public async Task<bool> AddMemberToSkybox(string skyboxId, string memberId)
    {
        try
        {
            ObjectId skyboxObjectId = ObjectId.Parse(skyboxId);
            var filter = Builders<Skybox>.Filter.Eq(s => s.Id, skyboxObjectId);
            var update = Builders<Skybox>.Update.AddToSet(s => s.SkyboxChannelMembers, memberId);

            await _skyboxesCollection.UpdateOneAsync(filter, update);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"AddMemberToSkybox Error: {ex.Message}");
            return false;
        }
    }
    public async Task<bool> RemoveMemberFromSkybox(string skyboxId, string memberId)
    {
        try
        {
            ObjectId skyboxObjectId = ObjectId.Parse(skyboxId);
            var filter = Builders<Skybox>.Filter.Eq(s => s.Id, skyboxObjectId);
            var update = Builders<Skybox>.Update.Pull(s => s.SkyboxChannelMembers, memberId);

            await _skyboxesCollection.UpdateOneAsync(filter, update);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"RemoveMemberFromSkybox Error: {ex.Message}");
            return false;
        }
    }
    public async Task<Skybox?> GetSkyboxById(string skyboxId)
    {
        try
        {
            ObjectId skyboxObjectId = ObjectId.Parse(skyboxId);
            var filter = Builders<Skybox>.Filter.Eq(s => s.Id, skyboxObjectId);
            return await _skyboxesCollection.Find(filter).FirstOrDefaultAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"GetSkyboxById Error: {ex.Message}");
            return null;
        }
    }
    public async Task<List<Skybox>> GetAllSkyboxesByStageId(string stageId)
    {
        try
        {
            var filter = Builders<Skybox>.Filter.Eq(s => s.StageId, stageId);
            var skyboxes = await _skyboxesCollection.Find(filter).ToListAsync();
            return skyboxes.OrderBy(s => s.CreatedAt).ToList();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"GetAllSkyboxesByStageId Error: {ex.Message}");
            return new List<Skybox>();
        }
    }

    public async Task<Skybox?> GetSkyboxByOwnerUserId(string userId)
    {
        try
        {
            var filter = Builders<Skybox>.Filter.Eq(s => s.OwnerUserId, userId);
            return await _skyboxesCollection.Find(filter).FirstOrDefaultAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"GetSkyboxByUserId Error: {ex.Message}");
            return null;
        }
    }

    public async Task<bool> MemberExistsInSkybox(string skyboxId, string userId)
    {
        try
        {
            ObjectId skyboxObjectId = ObjectId.Parse(skyboxId);
            var filter = Builders<Skybox>.Filter.Eq(s => s.Id, skyboxObjectId);
            var projection = Builders<Skybox>.Projection.Include(s => s.SkyboxChannelMembers);
            var skybox = await _skyboxesCollection.Find(filter).Project<Skybox>(projection).FirstOrDefaultAsync();

            if (skybox != null)
            {
                return skybox.SkyboxChannelMembers.Contains(userId);
            }

            return false;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"MemberExistsInSkybox Error: {ex.Message}");
            return false;
        }
    }
}
