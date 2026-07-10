using FunPay.Backend.DTOs;

namespace FunPay.Backend.Services;

public class AuthResult
{
    public bool IsSuccess { get; init; }

    public int StatusCode { get; init; } = StatusCodes.Status200OK;

    public string Message { get; init; } = string.Empty;

    public AuthResponse? Session { get; init; }

    public static AuthResult Success(AuthResponse session)
    {
        return new AuthResult
        {
            IsSuccess = true,
            Session = session
        };
    }

    public static AuthResult Failure(string message, int statusCode = StatusCodes.Status400BadRequest)
    {
        return new AuthResult
        {
            IsSuccess = false,
            StatusCode = statusCode,
            Message = message
        };
    }
}
