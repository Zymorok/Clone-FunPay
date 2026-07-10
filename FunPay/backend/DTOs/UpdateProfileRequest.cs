using System.ComponentModel.DataAnnotations;

namespace FunPay.Backend.DTOs;

public class UpdateProfileRequest
{
    [Required]
    [StringLength(32, MinimumLength = 3)]
    public string Nick { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Description { get; set; }

    [StringLength(20)]
    public string? Gender { get; set; }

    public DateOnly? BirthDate { get; set; }

    [StringLength(2)]
    public string? CountryCode { get; set; }

    [MaxLength(6)]
    public List<ProfileContactRequest> Contacts { get; set; } = [];

    [StringLength(30)]
    public string? AvatarStyle { get; set; }

    [StringLength(30)]
    public string? BannerStyle { get; set; }

    [StringLength(30)]
    public string? FrameStyle { get; set; }

    [StringLength(500)]
    public string? SelectedAvatarAsset { get; set; }

    [StringLength(500)]
    public string? SelectedBannerAsset { get; set; }

    [StringLength(500)]
    public string? SelectedFrameAsset { get; set; }

    [StringLength(500)]
    public string? SelectedWallpaperAsset { get; set; }
}
