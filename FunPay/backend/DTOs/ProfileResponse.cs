namespace FunPay.Backend.DTOs;

public class ProfileResponse
{
    public int Id { get; set; }

    public string PublicId { get; set; } = string.Empty;
    public string Nick { get; set; } = string.Empty;
    public string NormalizedNick { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string PresenceStatus { get; set; } = "offline";
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? LastLoginAt { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public DateOnly? BirthDate { get; set; }
    public string CountryCode { get; set; } = string.Empty;
    public List<ProfileContactResponse> Contacts { get; set; } = [];
    public string AvatarUrl { get; set; } = string.Empty;
    public string AvatarStyle { get; set; } = "gold";
    public string BannerStyle { get; set; } = "midnight";
    public string FrameStyle { get; set; } = "gold";
    public string SelectedAvatarAsset { get; set; } = string.Empty;
    public string SelectedBannerAsset { get; set; } = string.Empty;
    public string SelectedFrameAsset { get; set; } = string.Empty;
    public string SelectedWallpaperAsset { get; set; } = string.Empty;
}
