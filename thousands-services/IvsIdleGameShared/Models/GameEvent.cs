using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace IvsIdleGameShared.Models
{
    /*
    {
        "vendorEventId": "events.WildcardPlaytest.1722958060533",
        "name": "matchstart",
        "timestamp": 1722356514307,
        "team0Name": "Brent",
        "team0Champion": "Bolgar",
        "team0Color": "#ff0000",
        "team1Name": "Eric",
        "team1Champion": "Ragna",
        "team1Color": "#0000ff",
        "arenaName": "Lushland"       
    }

    {
        "vendorEventId": "events.WildcardPlaytest.1722958060533",
        "name": "goalieko",
        "timestamp": 1722356514307,
        "teamId": 0 //TeamId that had the goalie KO'ed        
    }

    {
        "vendorEventId": "events.WildcardPlaytest.1722958060533",
        "name": "goalierespawn",
        "timestamp": 1722356514307,
        "teamId": 0 //TeamId that had the goalie respawn       
    }

    {
        "vendorEventId": "events.WildcardPlaytest.1722958060533",
        "name": "score",
        "timestamp": 1722356514307,
        "teamId": 0 //TeamId that scored       
    }

    {
        "vendorEventId": "events.WildcardPlaytest.1722351189993",
        "name": "championko", 
        "timestamp": 1722356514307,
        "teamid": 1 //TeamId that had the champion KO'ed       
    }

    {
       "EventId": "asd",
       "MatchId": "Match1",
       "Events": [
            {
               "Name": "GoalieSpawned",
               "Timestamp": 1428576748625,
               "Target": "BP_GoalieCreature_Lubabub_C_1",
               "Instigator": "None",
               "ContextTags": ["Context.Team.0", "creature.lubabub", "creature.epic", "Status.Size.L", "Status.Stationary", "Status.KnockbackImmunity", "UI.HideHealthBar", "Status.IsGoalie", "House.Lubabub"],
               "Data": {}
           }, 
           {
               "Name": "GoalieSpawned",
               "Timestamp": 1428577636391,
               "Target": "BP_GoalieCreature_Chronos_C_1",
               "Instigator": "None",
               "ContextTags": ["Context.Team.1", "creature.epic", "Status.Size.L", "Status.Stationary", "Status.KnockbackImmunity", "UI.HideHealthBar", "Status.IsGoalie", "House.Chronos", "creature.chronos"],
               "Data": {}
           }, 
           {
               "Name": "MatchStarted",
               "Timestamp": 1428577658552,
               "Target": "None",
               "Instigator": "None",
               "ContextTags": [],
               "Data": {
                   "Team0Champion": "Bolgar",
                   "Team1Champion": "Locke",
                   "Team0Sidekick": "Burr",
                   "Team1Sidekick": "Volt",
                   "Team0Name": "260",
                   "Team0GamerTag": "",
                   "Team1Name": "261",
                   "Team1GamerTag": "",
                   "Team0ShortName": "",
                   "Team0Color": "78BA2FFF",
                   "Team1ShortName": "",
                   "Team1Color": "C6A400FF"
               }
            }
        ]
    }
    */


    public class GameEvent
    {
        [JsonPropertyName("EventId")]
        [BsonElement("EventId")]
        public string VendorEventId { get; set; } = "";

        [JsonPropertyName("MatchId")]
        [BsonElement("MatchId")]
        public string MatchId { get; set; } = "";

        [JsonPropertyName("Events")]
        [BsonElement("Events")]
        public GameEventEvent[]? Events { get; set; } = null;
    }
}
