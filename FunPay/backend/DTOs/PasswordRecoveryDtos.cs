using System.ComponentModel.DataAnnotations;

namespace FunPay.Backend.DTOs;

public sealed class PasswordRecoveryRequest
{
    [Required]
    [MaxLength(254)]
    public string Identity { get; set; } = string.Empty;

    [MaxLength(2)]
    public string Language { get; set; } = "ru";
}

public sealed class PasswordRecoveryCodeRequest
{
    [Required]
    [MaxLength(254)]
    public string Identity { get; set; } = string.Empty;

    [Required]
    [RegularExpression("^[0-9]{6}$")]
    public string Code { get; set; } = string.Empty;
}

public class PasswordRecoveryTicketRequest
{
    [Required]
    public string Ticket { get; set; } = string.Empty;
}

public sealed class PasswordRecoveryResetRequest : PasswordRecoveryTicketRequest
{
    [Required]
    [MinLength(8)]
    [MaxLength(100)]
    public string Password { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string ConfirmPassword { get; set; } = string.Empty;
}

public sealed class PasswordRecoveryAcceptedResponse
{
    public string Message { get; set; } = string.Empty;
}

public sealed class PasswordRecoveryVerifiedResponse
{
    public string Ticket { get; set; } = string.Empty;

    public DateTimeOffset ExpiresAt { get; set; }
}
