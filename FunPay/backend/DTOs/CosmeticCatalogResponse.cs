namespace FunPay.Backend.DTOs;

public class CosmeticCatalogResponse
{
    public List<CosmeticAssetResponse> Avatars { get; set; } = [];
    public List<CosmeticAssetResponse> Banners { get; set; } = [];
    public List<CosmeticAssetResponse> Frames { get; set; } = [];
    public List<CosmeticAssetResponse> Wallpapers { get; set; } = [];
}
