using System.Text.RegularExpressions;

namespace FunPay.Backend.Services;

internal static class NickRules
{
    private static readonly Regex AllowedPattern = new(
        "^[a-zA-Z0-9_.-]+$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    public static string PrepareForDisplay(string? value)
    {
        return (value ?? string.Empty).Trim();
    }

    public static string Normalize(string? value)
    {
        return PrepareForDisplay(value).ToLowerInvariant();
    }

    public static bool IsAllowed(string value)
    {
        return AllowedPattern.IsMatch(value);
    }
}
