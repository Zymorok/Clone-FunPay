using FunPay.Backend.DTOs;
using FunPay.Backend.Models;

namespace FunPay.Backend.Services;

internal static class ProfileContactFactory
{
    private static readonly Dictionary<string, string> ContactServices = new(StringComparer.OrdinalIgnoreCase)
    {
        ["telegram"] = "Telegram",
        ["discord"] = "Discord",
        ["youtube"] = "YouTube",
        ["twitch"] = "Twitch",
        ["twitter"] = "X / Twitter",
        ["instagram"] = "Instagram",
        ["tiktok"] = "TikTok",
        ["facebook"] = "Facebook",
        ["reddit"] = "Reddit",
        ["github"] = "GitHub",
        ["steam"] = "Steam",
        ["kick"] = "Kick",
        ["custom"] = ""
    };

    public static List<ProfileContact>? Build(IEnumerable<ProfileContactRequest>? requestedContacts)
    {
        var contacts = requestedContacts?.Take(7).ToList() ?? [];

        if (contacts.Count > 6)
        {
            return null;
        }

        var prepared = new List<ProfileContact>(contacts.Count);

        for (var index = 0; index < contacts.Count; index += 1)
        {
            var requested = contacts[index];
            var service = ProfileValueRules.Normalize(requested.Service).ToLowerInvariant();
            var title = ProfileValueRules.Normalize(requested.Title);
            var url = ProfileValueRules.Normalize(requested.Url);

            if (!ContactServices.TryGetValue(service, out var serviceTitle)
                || !Uri.TryCreate(url, UriKind.Absolute, out var uri)
                || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            {
                return null;
            }

            if (service == "custom" && (title.Length is < 2 or > 60))
            {
                return null;
            }

            prepared.Add(new ProfileContact
            {
                Service = service,
                Title = service == "custom" ? title : serviceTitle,
                Url = url,
                Position = index
            });
        }

        return prepared;
    }
}
