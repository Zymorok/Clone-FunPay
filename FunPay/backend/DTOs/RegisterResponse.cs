namespace FunPay.Backend.DTOs;

public class RegisterResponse
{
    public int Id { get; set; }

    public string PublicId { get; set; } = string.Empty;

    public string Nick { get; set; } = string.Empty;

    public string NormalizedNick { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public bool TwoFactorEnabled { get; set; }

    public string Role { get; set; } = string.Empty;

    public bool CanManageTeam { get; set; }

    public string Gender { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    public string AvatarUrl { get; set; } = string.Empty;

    public string AvatarStyle { get; set; } = "gold";

    public string SelectedAvatarAsset { get; set; } = string.Empty;

    public string SelectedFrameAsset { get; set; } = string.Empty;

    public string SelectedWallpaperAsset { get; set; } = string.Empty;
}
