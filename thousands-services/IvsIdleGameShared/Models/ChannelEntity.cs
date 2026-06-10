using System;

namespace IvsIdleGameShared.Models;

public class ChannelEntity
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public ObjectCustom? Custom { get; set; } = new ObjectCustom();

}

public class ObjectCustom
{
    public string ProfileUrl { get; set; } = string.Empty;
}
