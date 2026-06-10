using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;

namespace IvsIdleGameShared.Models.Wildcard;

[BsonIgnoreExtraElements]
public class MatchResult
{
    [BsonId]
    public ObjectId Id { get; set; }

    [BsonElement("matchResults")]
    public MatchResults MatchResults { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; }
}

[BsonIgnoreExtraElements]
public class MatchResults
{
    [BsonElement("lobbyId")]
    public string LobbyId { get; set; }

    [BsonElement("playerData")]
    public List<PlayerData> PlayerData { get; set; }

    [BsonElement("winningTeamId")]
    public long WinningTeamId { get; set; }

    [BsonElement("duration")]
    public double Duration { get; set; }

    [BsonElement("eventId")]
    public string EventId { get; set; }

    [BsonElement("matchId")]
    public string MatchId { get; set; }

    [BsonElement("gameTypeId")]
    public string GameTypeId { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; }
}

[BsonIgnoreExtraElements]
public class PlayerData
{
    [BsonElement("gamerTag")]
    public long GamerTag { get; set; }

    [BsonElement("teamId")]
    public int TeamId { get; set; }

    [BsonElement("loadout")]
    public Loadout Loadout { get; set; }

    [BsonElement("castCards")]
    public List<CastCard> CastCards { get; set; }

    [BsonElement("kos")]
    public int Kos { get; set; }

    [BsonElement("totalDamageDone")]
    public int TotalDamageDone { get; set; }

    [BsonElement("totalDamageReceived")]
    public int TotalDamageReceived { get; set; }

    [BsonElement("totalHealingInflicted")]
    public int TotalHealingInflicted { get; set; }

    [BsonElement("totalHealingReceived")]
    public int TotalHealingReceived { get; set; }

    [BsonElement("knockedouts")]
    public int Knockedouts { get; set; }

    [BsonElement("summonKOs")]
    public int SummonKOs { get; set; }

    [BsonElement("goalieKOs")]
    public int GoalieKOs { get; set; }

    [BsonElement("sidekicksSpawned")]
    public int SidekicksSpawned { get; set; }

    [BsonElement("healthCollected")]
    public long HealthCollected { get; set; }

    [BsonElement("manaCollected")]
    public long ManaCollected { get; set; }

    [BsonElement("damageTracking")]
    public Dictionary<string, long> DamageTracking { get; set; }

    [BsonElement("statusTracking")]
    public Dictionary<string, long> StatusTracking { get; set; }

    [BsonElement("totalWildcardsAcquired")]
    public long TotalWildcardsAcquired { get; set; }
}

[BsonIgnoreExtraElements]
public class Loadout
{
    [BsonElement("_id")]
    public string Id { get; set; }

    [BsonElement("championId")]
    public string ChampionId { get; set; }

    [BsonElement("name")]
    public string Name { get; set; }

    [BsonElement("summonCardIds")]
    public List<string> SummonCardIds { get; set; }

    [BsonElement("talentCardIds")]
    public List<string> TalentCardIds { get; set; }

    [BsonElement("wildCardIds")]
    public List<string> WildCardIds { get; set; }

    [BsonElement("cosmeticCardIds")]
    public List<string> CosmeticCardIds { get; set; }

    [BsonElement("equippedCosmetics")]
    public Dictionary<string, object> EquippedCosmetics { get; set; }

    [BsonElement("isDefault")] public bool? IsDefault { get; set; } = false;
}

[BsonIgnoreExtraElements]
public class CastCard
{
    [BsonElement("_id")]
    public string Id { get; set; }

    [BsonElement("casts")]
    public int Casts { get; set; }
}