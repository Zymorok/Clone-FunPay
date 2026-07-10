namespace FunPay.Backend.DTOs;

public class PresenceHeartbeatRequest
{
    public bool IsActive { get; set; }
}

public class PresenceResponse
{
    public string Status { get; set; } = "offline";
}
