namespace FunPay.Backend.Models;

public class AccountSecurityChallenge
{
    public int Id { get; set; }

    public int UserId { get; set; }

    // NOTE: Назначение не позволяет использовать код входа для смены почты или настроек 2FA.
    public string Purpose { get; set; } = string.Empty;

    // В базе хранятся только отпечатки одноразового кода и непрозрачного токена.
    public string CodeHash { get; set; } = string.Empty;

    public string TokenHash { get; set; } = string.Empty;

    public string? PendingEmail { get; set; }

    public bool? PendingTwoFactorEnabled { get; set; }

    // NOTE: Для отложенной смены хранится только готовый безопасный отпечаток нового пароля.
    public string? PendingPasswordHash { get; set; }

    public int FailedAttempts { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset ExpiresAt { get; set; }

    public DateTimeOffset? UsedAt { get; set; }

    public User User { get; set; } = null!;
}
