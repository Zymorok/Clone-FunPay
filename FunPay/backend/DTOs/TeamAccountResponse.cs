namespace FunPay.Backend.DTOs;

public class TeamAccountResponse
{
    public int Id { get; set; }

    public string PublicId { get; set; } = string.Empty;

    public string Nick { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public string Gender { get; set; } = string.Empty;
}
