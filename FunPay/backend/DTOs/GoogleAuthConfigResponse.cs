namespace FunPay.Backend.DTOs;

public sealed class GoogleAuthConfigResponse
{
    public bool Enabled { get; set; }

    public string ClientId { get; set; } = string.Empty;
}
