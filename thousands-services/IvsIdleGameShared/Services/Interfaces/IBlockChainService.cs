using System;
using IvsIdleGameShared.Models.Wildcard;

namespace IvsIdleGameShared.Services.Interfaces;

public class GetWildpassesAndSwagPinsResponse
{
    public List<Wildpass> Wildpasses { get; set; } = new List<Wildpass>();
    public List<SwagPin> SwagPins { get; set; } = new List<SwagPin>();
}


public interface IBlockChainService
{

    Task<GetWildpassesAndSwagPinsResponse> GetWildpassesAndSwagPins(string fanId);

    // Task<(List<Wildpass> Wildpasses, List<SwagPin> SwagPins)> GetWildpassAndSwagPin(string vendorEventId);
}
