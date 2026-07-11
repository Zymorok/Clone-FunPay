using System.Security.Claims;
using FunPay.Backend.Data;
using FunPay.Backend.DTOs;
using FunPay.Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace FunPay.Backend.Services;

public class ProfileService(
    AppDbContext dbContext,
    ProfileUserResolver users,
    ProfileMapper mapper,
    ProfileAvatarService avatars,
    ProfileCosmeticsService cosmetics)
{
    public async Task<ProfileResult> GetAsync(ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        var user = await users.FindCurrentAsync(principal, cancellationToken);
        return user is null
            ? ProfileResult.Failure("Сессия истекла. Войдите снова.", StatusCodes.Status401Unauthorized)
            : ProfileResult.Success(mapper.Map(user));
    }

    public async Task<ProfileResult> GetPublicAsync(
        ClaimsPrincipal principal,
        string? identifier,
        CancellationToken cancellationToken)
    {
        var user = await users.FindByIdentifierAsync(identifier, cancellationToken);

        if (user is null)
        {
            return ProfileResult.Failure("Профиль не найден.", StatusCodes.Status404NotFound);
        }

        var actor = await users.FindCurrentAsync(principal, cancellationToken);
        return ProfileResult.Success(mapper.Map(
            user,
            includePrivateData: actor is not null && CanEdit(actor, user)));
    }

    public CosmeticCatalogResponse GetCosmetics() => cosmetics.GetCatalog();

    public async Task<ProfileResult> UpdateAsync(
        ClaimsPrincipal principal,
        UpdateProfileRequest request,
        CancellationToken cancellationToken)
    {
        var user = await users.FindCurrentAsync(principal, cancellationToken);

        if (user is null)
        {
            return ProfileResult.Failure("Сессия истекла. Войдите снова.", StatusCodes.Status401Unauthorized);
        }

        return await UpdateUserAsync(user, request, cancellationToken);
    }

    public async Task<ProfileResult> UpdateByIdentifierAsync(
        ClaimsPrincipal principal,
        string? identifier,
        UpdateProfileRequest request,
        CancellationToken cancellationToken)
    {
        var actor = await users.FindCurrentAsync(principal, cancellationToken);

        if (actor is null)
        {
            return ProfileResult.Failure("Сессия истекла. Войдите снова.", StatusCodes.Status401Unauthorized);
        }

        var target = await users.FindByIdentifierAsync(identifier, cancellationToken);

        if (target is null)
        {
            return ProfileResult.Failure("Профиль не найден.", StatusCodes.Status404NotFound);
        }

        if (!CanEdit(actor, target))
        {
            return ProfileResult.Failure("У вас нет доступа к редактированию этого профиля.", StatusCodes.Status403Forbidden);
        }

        return await UpdateUserAsync(target, request, cancellationToken);
    }

    public async Task<ProfileResult> UploadAvatarAsync(
        ClaimsPrincipal principal,
        IFormFile? file,
        CancellationToken cancellationToken)
    {
        var user = await users.FindCurrentAsync(principal, cancellationToken);

        if (user is null)
        {
            return ProfileResult.Failure("Сессия истекла. Войдите снова.", StatusCodes.Status401Unauthorized);
        }

        return await avatars.UploadAsync(user, file, cancellationToken);
    }

    public async Task<ProfileResult> UploadAvatarByIdentifierAsync(
        ClaimsPrincipal principal,
        string? identifier,
        IFormFile? file,
        CancellationToken cancellationToken)
    {
        var actor = await users.FindCurrentAsync(principal, cancellationToken);

        if (actor is null)
        {
            return ProfileResult.Failure("Сессия истекла. Войдите снова.", StatusCodes.Status401Unauthorized);
        }

        var target = await users.FindByIdentifierAsync(identifier, cancellationToken);

        if (target is null)
        {
            return ProfileResult.Failure("Профиль не найден.", StatusCodes.Status404NotFound);
        }

        if (!CanEdit(actor, target))
        {
            return ProfileResult.Failure("У вас нет доступа к редактированию этого профиля.", StatusCodes.Status403Forbidden);
        }

        return await avatars.UploadAsync(target, file, cancellationToken);
    }

    private async Task<ProfileResult> UpdateUserAsync(
        User user,
        UpdateProfileRequest request,
        CancellationToken cancellationToken)
    {
        var nick = NickRules.PrepareForDisplay(request.Nick);
        var normalizedNick = NickRules.Normalize(nick);
        var gender = ProfileValueRules.Normalize(request.Gender).ToLowerInvariant();
        var countryCode = ProfileValueRules.Normalize(request.CountryCode).ToUpperInvariant();
        var avatarStyle = ProfileValueRules.NormalizeAvatarStyle(request.AvatarStyle);
        var bannerStyle = ProfileValueRules.Normalize(request.BannerStyle, "midnight");
        var frameStyle = ProfileValueRules.Normalize(request.FrameStyle, "gold");
        var selectedAvatarAsset = cosmetics.ResolveAssetPath(request.SelectedAvatarAsset, "avatars");
        var selectedBannerAsset = cosmetics.ResolveAssetPath(request.SelectedBannerAsset, "banners");
        var selectedFrameAsset = cosmetics.ResolveAssetPath(request.SelectedFrameAsset, "frames");
        var selectedWallpaperAsset = cosmetics.ResolveAssetPath(request.SelectedWallpaperAsset, "wallpapers");

        if (nick.Length is < 3 or > 32 || !NickRules.IsAllowed(nick))
        {
            return ProfileResult.Failure("Ник может содержать латинские буквы, цифры, точку, дефис и подчёркивание.", StatusCodes.Status400BadRequest);
        }

        if (await dbContext.Users.AnyAsync(
                current => current.Id != user.Id && current.NormalizedNick == normalizedNick,
                cancellationToken))
        {
            return ProfileResult.Failure("Такой ник уже занят.", StatusCodes.Status409Conflict);
        }

        if (!ProfileValueRules.AreSettingsAllowed(gender, countryCode, avatarStyle, bannerStyle, frameStyle))
        {
            return ProfileResult.Failure("Переданы недопустимые настройки профиля.", StatusCodes.Status400BadRequest);
        }

        if (!cosmetics.IsAllowed(selectedAvatarAsset, "avatars", allowsVideo: false)
            || !cosmetics.IsAllowed(selectedBannerAsset, "banners", allowsVideo: true)
            || !cosmetics.IsAllowed(selectedFrameAsset, "frames", allowsVideo: false)
            || !cosmetics.IsAllowed(selectedWallpaperAsset, "wallpapers", allowsVideo: true))
        {
            return ProfileResult.Failure("Выбранный предмет оформления больше недоступен.", StatusCodes.Status400BadRequest);
        }

        if (request.BirthDate is { } birthDate && (birthDate > DateOnly.FromDateTime(DateTime.UtcNow) || birthDate.Year < 1900))
        {
            return ProfileResult.Failure("Укажите корректную дату рождения.", StatusCodes.Status400BadRequest);
        }

        var contacts = ProfileContactFactory.Build(request.Contacts);

        if (contacts is null)
        {
            return ProfileResult.Failure("Проверьте ссылки и названия контактов.", StatusCodes.Status400BadRequest);
        }

        user.Nick = nick;
        user.NormalizedNick = normalizedNick;
        user.Description = ProfileValueRules.Normalize(request.Description);
        user.Gender = gender;
        user.BirthDate = request.BirthDate;
        user.CountryCode = countryCode;
        user.AvatarStyle = avatarStyle;
        user.BannerStyle = bannerStyle;
        user.FrameStyle = frameStyle;
        user.SelectedAvatarAsset = selectedAvatarAsset;
        user.SelectedBannerAsset = selectedBannerAsset;
        user.SelectedFrameAsset = selectedFrameAsset;
        user.SelectedWallpaperAsset = selectedWallpaperAsset;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        dbContext.ProfileContacts.RemoveRange(user.ProfileContacts);
        user.ProfileContacts = contacts;

        await dbContext.SaveChangesAsync(cancellationToken);
        return ProfileResult.Success(mapper.Map(user));
    }

    public static bool CanEdit(User actor, User target)
    {
        if (actor.Id == target.Id)
        {
            return true;
        }

        return actor.Role switch
        {
            UserRole.Admin => target.Role == UserRole.User,
            UserRole.Owner => target.Role is UserRole.User or UserRole.Admin,
            _ => false
        };
    }
}
