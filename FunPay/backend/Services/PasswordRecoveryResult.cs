using FunPay.Backend.DTOs;

namespace FunPay.Backend.Services;

public sealed class PasswordRecoveryResult
{
    public bool IsSuccess { get; init; }

    public int StatusCode { get; init; } = StatusCodes.Status200OK;

    public string Message { get; init; } = string.Empty;

    public PasswordRecoveryVerifiedResponse? Verification { get; init; }

    public AuthResponse? Session { get; init; }

    public static PasswordRecoveryResult Verified(string ticket, DateTimeOffset expiresAt)
    {
        return new PasswordRecoveryResult
        {
            IsSuccess = true,
            Verification = new PasswordRecoveryVerifiedResponse
            {
                Ticket = ticket,
                ExpiresAt = expiresAt
            }
        };
    }

    public static PasswordRecoveryResult Authenticated(AuthResponse session)
    {
        return new PasswordRecoveryResult
        {
            IsSuccess = true,
            Session = session
        };
    }

    public static PasswordRecoveryResult Failure(
        string message,
        int statusCode = StatusCodes.Status401Unauthorized)
    {
        return new PasswordRecoveryResult
        {
            IsSuccess = false,
            StatusCode = statusCode,
            Message = message
        };
    }
}
