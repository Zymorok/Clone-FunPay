namespace FunPay.Backend.Models;

public sealed class PasswordRecoveryCode
{
    public int Id { get; set; }

    public int UserId { get; set; }

    // Код из письма не хранится открытым даже в базе.
    public string CodeHash { get; set; } = string.Empty;

    public int FailedAttempts { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset ExpiresAt { get; set; }

    public DateTimeOffset? VerifiedAt { get; set; }

    // После верного кода браузер получает отдельный одноразовый билет.
    public string? TicketHash { get; set; }

    public DateTimeOffset? TicketExpiresAt { get; set; }

    public DateTimeOffset? UsedAt { get; set; }

    public User User { get; set; } = null!;
}
