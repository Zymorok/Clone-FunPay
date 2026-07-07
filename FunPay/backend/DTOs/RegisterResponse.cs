namespace FunPay.Backend.DTOs;

public class RegisterResponse
{
    public int Id { get; set; }

    public string Nick { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }
}
