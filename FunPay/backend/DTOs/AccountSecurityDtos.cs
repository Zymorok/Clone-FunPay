using System.ComponentModel.DataAnnotations;

namespace FunPay.Backend.DTOs;

public sealed class SecurityChallengeResponse
{
    public string Token { get; set; } = string.Empty;

    public DateTimeOffset ExpiresAt { get; set; }
}

public sealed class TwoFactorLoginRequiredResponse
{
    public bool RequiresTwoFactor { get; set; } = true;

    public string ChallengeToken { get; set; } = string.Empty;

    public DateTimeOffset ExpiresAt { get; set; }
}

public class VerifySecurityCodeRequest
{
    [Required]
    public string Token { get; set; } = string.Empty;

    [Required]
    [RegularExpression("^[0-9]{6}$")]
    public string Code { get; set; } = string.Empty;
}

public sealed class TwoFactorToggleRequest
{
    public bool Enabled { get; set; }

    [MaxLength(5)]
    public string Language { get; set; } = "ru";
}

public sealed class TwoFactorStatusResponse
{
    public bool Enabled { get; set; }
}

public sealed class EmailChangeRequest
{
    [Required]
    [EmailAddress]
    [MaxLength(254)]
    public string NewEmail { get; set; } = string.Empty;

    [MaxLength(5)]
    public string Language { get; set; } = "ru";
}

public sealed class VerifyCurrentEmailRequest : VerifySecurityCodeRequest
{
    [MaxLength(5)]
    public string Language { get; set; } = "ru";
}

public sealed class EmailChangeCompletedResponse
{
    public string Email { get; set; } = string.Empty;

    public bool TwoFactorEnabled { get; set; }
}

public sealed class PasswordChangeRequest
{
    [Required]
    [MinLength(8)]
    [MaxLength(128)]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    [MaxLength(128)]
    public string NewPassword { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    [MaxLength(128)]
    public string ConfirmPassword { get; set; } = string.Empty;

    [MaxLength(5)]
    public string Language { get; set; } = "ru";
}

public sealed class ManagedPasswordChangeRequest
{
    [Required]
    [MinLength(8)]
    [MaxLength(128)]
    public string NewPassword { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    [MaxLength(128)]
    public string ConfirmPassword { get; set; } = string.Empty;
}

public sealed class PasswordChangeResponse
{
    public bool RequiresCode { get; set; }

    public string ChallengeToken { get; set; } = string.Empty;

    public DateTimeOffset? ExpiresAt { get; set; }

    public AuthResponse? Session { get; set; }
}

public sealed class SecurityActionCompletedResponse
{
    public bool Completed { get; set; } = true;
}
