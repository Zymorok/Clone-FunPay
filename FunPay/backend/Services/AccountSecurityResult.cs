namespace FunPay.Backend.Services;

public sealed class AccountSecurityResult<T> where T : class
{
    public bool IsSuccess { get; private init; }

    public int StatusCode { get; private init; } = StatusCodes.Status200OK;

    public string Message { get; private init; } = string.Empty;

    public T? Value { get; private init; }

    public static AccountSecurityResult<T> Success(T value) => new()
    {
        IsSuccess = true,
        Value = value
    };

    public static AccountSecurityResult<T> Failure(
        string message,
        int statusCode = StatusCodes.Status400BadRequest) => new()
    {
        StatusCode = statusCode,
        Message = message
    };
}
