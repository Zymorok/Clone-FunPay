namespace FunPay.Backend.Services;

public sealed class ChatAccessException : Exception
{
    public ChatAccessException() : base("Этот чат недоступен.")
    {
    }
}
