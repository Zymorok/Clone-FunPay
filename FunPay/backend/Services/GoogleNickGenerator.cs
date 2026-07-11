using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace FunPay.Backend.Services;

internal static class GoogleNickGenerator
{
    private const int MaxNickLength = 32;

    public static string CreateBase(string? displayName, string email)
    {
        var fromName = Sanitize(displayName);

        if (fromName.Length >= 3)
        {
            return fromName;
        }

        var emailName = email.Split('@', 2)[0];
        var fromEmail = Sanitize(emailName);
        return fromEmail.Length >= 3 ? fromEmail : "user";
    }

    public static string CreateCandidate(string baseNick, int attempt)
    {
        if (attempt == 0)
        {
            return baseNick[..Math.Min(baseNick.Length, MaxNickLength)];
        }

        // NOTE: Случайный цифровой хвост не раскрывает почту и не зависит от числа пользователей.
        var suffix = $"_{RandomNumberGenerator.GetInt32(100_000, 1_000_000)}";
        var availableLength = MaxNickLength - suffix.Length;
        return $"{baseNick[..Math.Min(baseNick.Length, availableLength)]}{suffix}";
    }

    private static string Sanitize(string? value)
    {
        var source = (value ?? string.Empty).Trim().Normalize(NormalizationForm.FormD);
        var result = new StringBuilder(MaxNickLength);
        var separatorPending = false;

        foreach (var character in source)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) == UnicodeCategory.NonSpacingMark)
            {
                continue;
            }

            if (character is >= 'a' and <= 'z' or >= 'A' and <= 'Z' or >= '0' and <= '9')
            {
                if (separatorPending && result.Length > 0 && result.Length < MaxNickLength)
                {
                    result.Append('_');
                }

                separatorPending = false;
                result.Append(character);
            }
            else if (result.Length > 0)
            {
                separatorPending = true;
            }

            if (result.Length >= MaxNickLength)
            {
                break;
            }
        }

        return result.ToString().TrimEnd('_');
    }
}
