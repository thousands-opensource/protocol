using System;

namespace IvsIdleGameShared.Models;

public class ThousandsJwt
{
    public string UserId { get; set; } = string.Empty;
    public string[] Roles { get; set; } = [""];
}
