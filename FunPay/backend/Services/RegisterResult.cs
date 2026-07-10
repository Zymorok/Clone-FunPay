using FunPay.Backend.DTOs;

namespace FunPay.Backend.Services;

public class RegisterResult
{
    public bool IsSuccess { get; private init; }

    public int StatusCode { get; private init; }

    public string Message { get; private init; } = string.Empty;

    public AuthResponse? Session { get; private init; }

    public static RegisterResult Success(AuthResponse session)
    {
        return new RegisterResult
        {
            IsSuccess = true,
            StatusCode = StatusCodes.Status201Created,
            Session = session
        };
    }

    public static RegisterResult Failure(string message, int statusCode = StatusCodes.Status400BadRequest)
    {
        return new RegisterResult
        {
            IsSuccess = false,
            StatusCode = statusCode,
            Message = message
        };
    }
}
