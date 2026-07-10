namespace FunPay.Backend.Models;

public class UserSession
{
    public int Id { get; set; }

    public int UserId { get; set; }

    // Храним только отпечаток токена, а не сам токен.
    public string RefreshTokenHash { get; set; } = string.Empty;

    public DateTimeOffset ExpiresAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset LastUsedAt { get; set; } = DateTimeOffset.UtcNow;

    public User User { get; set; } = null!;
}
