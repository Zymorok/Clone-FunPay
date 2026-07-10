using FunPay.Backend.DTOs;
using FunPay.Backend.Models;

namespace FunPay.Backend.Services;

public class ProfileMapper(ProfileCosmeticsService cosmetics)
{
    public ProfileResponse Map(User user, bool includePrivateData = true) => new()
    {
        Id = user.Id,
        PublicId = user.PublicId,
        Nick = user.Nick,
        NormalizedNick = user.NormalizedNick,
        Email = includePrivateData ? user.Email : string.Empty,
        Role = user.Role.ToString(),
        PresenceStatus = PresenceService.ResolveStatus(user),
        CreatedAt = user.CreatedAt,
        LastLoginAt = includePrivateData ? user.LastLoginAt : null,
        Description = user.Description ?? string.Empty,
        Gender = user.Gender ?? string.Empty,
        BirthDate = user.BirthDate,
        CountryCode = user.CountryCode ?? string.Empty,
        Contacts = user.ProfileContacts
            .OrderBy(contact => contact.Position)
            .Select(contact => new ProfileContactResponse
            {
                Service = contact.Service,
                Title = contact.Title,
                Url = contact.Url,
                Position = contact.Position
            })
            .ToList(),
        AvatarUrl = user.AvatarUrl ?? string.Empty,
        AvatarStyle = user.AvatarStyle,
        BannerStyle = user.BannerStyle,
        FrameStyle = user.FrameStyle,
        SelectedAvatarAsset = user.SelectedAvatarAsset ?? string.Empty,
        SelectedBannerAsset = cosmetics.ResolvePreferredVideoAsset(user.SelectedBannerAsset, "banners", "1920x480"),
        SelectedFrameAsset = user.SelectedFrameAsset ?? string.Empty,
        SelectedWallpaperAsset = cosmetics.ResolvePreferredVideoAsset(user.SelectedWallpaperAsset, "wallpapers", "1920x1080")
    };
}
