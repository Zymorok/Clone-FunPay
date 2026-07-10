using FunPay.Backend.DTOs;

namespace FunPay.Backend.Services;

public class ProfileResult
{
    public bool IsSuccess { get; private init; }
    public int StatusCode { get; private init; }
    public string Message { get; private init; } = string.Empty;
    public ProfileResponse? Profile { get; private init; }

    public static ProfileResult Success(ProfileResponse profile) => new()
    {
        IsSuccess = true,
        StatusCode = StatusCodes.Status200OK,
        Profile = profile
    };

    public static ProfileResult Failure(string message, int statusCode) => new()
    {
        IsSuccess = false,
        StatusCode = statusCode,
        Message = message
    };
}
