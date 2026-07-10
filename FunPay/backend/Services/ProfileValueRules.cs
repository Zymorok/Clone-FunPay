using System.Text.RegularExpressions;

namespace FunPay.Backend.Services;

internal static class ProfileValueRules
{
    private static readonly Regex AvatarColorPattern = new("^#[0-9a-fA-F]{6}$", RegexOptions.Compiled);
    private static readonly Regex DisabledAvatarColorPattern = new("^none:#[0-9a-fA-F]{6}$", RegexOptions.Compiled);
    private static readonly Regex RainbowAvatarColorPattern = new("^rainbow(?::(?:shift|spectrum))?(?::#[0-9a-fA-F]{6})?$", RegexOptions.Compiled);
    private static readonly Regex CountryCodePattern = new("^[A-Z]{2}$", RegexOptions.Compiled);
    private static readonly HashSet<string> AllowedGenders = ["", "male", "female", "other"];
    private static readonly HashSet<string> AllowedAvatarStyles = ["gold", "cyan", "violet", "none"];
    private static readonly HashSet<string> AllowedBannerStyles = ["midnight", "ember", "aurora"];
    private static readonly HashSet<string> AllowedFrameStyles = ["gold", "cyan", "violet", "none"];

    public static string Normalize(string? value, string fallback = "") =>
        string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();

    public static string NormalizeAvatarStyle(string? value)
    {
        var normalized = Normalize(value, "gold");
        if (AvatarColorPattern.IsMatch(normalized)) return normalized.ToUpperInvariant();
        if (DisabledAvatarColorPattern.IsMatch(normalized)) return $"none:{normalized[5..].ToUpperInvariant()}";
        if (RainbowAvatarColorPattern.IsMatch(normalized))
        {
            var parts = normalized.Split(':');
            var mode = parts.Length > 1 && (parts[1] == "shift" || parts[1] == "spectrum") ? parts[1] : "shift";
            var color = parts.LastOrDefault(part => part.StartsWith('#'));
            return color is null ? $"rainbow:{mode}" : $"rainbow:{mode}:{color.ToUpperInvariant()}";
        }

        return normalized;
    }

    public static bool AreSettingsAllowed(
        string gender,
        string countryCode,
        string avatarStyle,
        string bannerStyle,
        string frameStyle) =>
        AllowedGenders.Contains(gender)
        && (countryCode.Length == 0 || CountryCodePattern.IsMatch(countryCode))
        && (AllowedAvatarStyles.Contains(avatarStyle)
            || AvatarColorPattern.IsMatch(avatarStyle)
            || DisabledAvatarColorPattern.IsMatch(avatarStyle)
            || RainbowAvatarColorPattern.IsMatch(avatarStyle))
        && AllowedBannerStyles.Contains(bannerStyle)
        && AllowedFrameStyles.Contains(frameStyle);
}
