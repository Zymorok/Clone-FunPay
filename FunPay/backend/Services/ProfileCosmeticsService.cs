using FunPay.Backend.DTOs;

namespace FunPay.Backend.Services;

public class ProfileCosmeticsService(IWebHostEnvironment environment)
{
    private const string PublicPrefix = "/assets/website/profile-cosmetics/";

    public CosmeticCatalogResponse GetCatalog() => new()
    {
        Avatars = ReadAssets("avatars"),
        Banners = ReadAssets("banners", "1920x480"),
        Frames = ReadAssets("frames"),
        Wallpapers = ReadAssets("wallpapers", "1920x1080")
    };

    public string ResolvePreferredVideoAsset(string? assetPath, string category, string size)
    {
        var normalizedPath = ProfileValueRules.Normalize(assetPath);

        if (string.IsNullOrEmpty(normalizedPath)
            || Path.GetExtension(normalizedPath).Equals(".mp4", StringComparison.OrdinalIgnoreCase)
            || !normalizedPath.StartsWith($"{PublicPrefix}{category}/", StringComparison.Ordinal))
        {
            return normalizedPath;
        }

        var suffix = normalizedPath[PublicPrefix.Length..].Replace('/', Path.DirectorySeparatorChar);
        var imagePath = Path.GetFullPath(Path.Combine(GetRoot(), suffix));
        var videoPath = Path.Combine(
            Path.GetDirectoryName(imagePath)!,
            $"{Path.GetFileNameWithoutExtension(imagePath)}__{size}__h264.mp4");

        return File.Exists(videoPath) ? ToPublicPath(videoPath) : normalizedPath;
    }

    public bool IsAllowed(string path, string category, bool allowsVideo)
    {
        if (string.IsNullOrEmpty(path))
        {
            return true;
        }

        if (!path.StartsWith($"{PublicPrefix}{category}/", StringComparison.Ordinal)
            || path.Contains("..", StringComparison.Ordinal))
        {
            return false;
        }

        var suffix = path[PublicPrefix.Length..].Replace('/', Path.DirectorySeparatorChar);
        var physicalPath = Path.GetFullPath(Path.Combine(GetRoot(), suffix));
        var categoryRoot = Path.GetFullPath(Path.Combine(GetRoot(), category));

        if (!physicalPath.StartsWith(categoryRoot, StringComparison.OrdinalIgnoreCase) || !File.Exists(physicalPath))
        {
            return false;
        }

        var extension = Path.GetExtension(physicalPath).ToLowerInvariant();
        return extension is ".webp" or ".jpeg" or ".jpg" or ".png"
            || (allowsVideo && (extension is ".mp4" or ".webm"));
    }

    public string ResolveAssetPath(string? assetPath, string category)
    {
        var normalizedPath = ProfileValueRules.Normalize(assetPath);

        if (string.IsNullOrEmpty(normalizedPath)
            || !normalizedPath.StartsWith($"{PublicPrefix}{category}/", StringComparison.Ordinal)
            || normalizedPath.Contains("..", StringComparison.Ordinal))
        {
            return normalizedPath;
        }

        var suffix = normalizedPath[PublicPrefix.Length..].Replace('/', Path.DirectorySeparatorChar);
        var directPath = Path.GetFullPath(Path.Combine(GetRoot(), suffix));

        if (File.Exists(directPath))
        {
            return normalizedPath;
        }

        var categoryPath = Path.Combine(GetRoot(), category);
        var fileName = Path.GetFileName(suffix);

        if (!Directory.Exists(categoryPath) || string.IsNullOrEmpty(fileName))
        {
            return normalizedPath;
        }

        var matches = Directory.EnumerateFiles(categoryPath, fileName, SearchOption.AllDirectories)
            .Take(2)
            .ToList();

        return matches.Count == 1 ? ToPublicPath(matches[0]) : normalizedPath;
    }

    private List<CosmeticAssetResponse> ReadAssets(string category, string? fullVideoSize = null)
    {
        var categoryPath = Path.Combine(GetRoot(), category);

        if (!Directory.Exists(categoryPath))
        {
            return [];
        }

        return Directory.GetFiles(categoryPath, "*__cover.*", SearchOption.AllDirectories)
            .Where(IsCoverImage)
            .OrderBy(path => path, StringComparer.OrdinalIgnoreCase)
            .Select(path => CreateAsset(path, category, categoryPath, fullVideoSize))
            .ToList();
    }

    private CosmeticAssetResponse CreateAsset(
        string path,
        string category,
        string categoryPath,
        string? fullVideoSize)
    {
        var relativePath = Path.GetRelativePath(categoryPath, path);
        var thumbnailPath = Path.Combine(GetRoot(), "thumbnails", category, Path.ChangeExtension(relativePath, ".webp"));
        var animatedVideoPath = Path.Combine(GetRoot(), "animated-videos", category, Path.ChangeExtension(relativePath, ".webm"));
        var animatedThumbnailPath = Path.Combine(GetRoot(), "animated-thumbnails", category, Path.ChangeExtension(relativePath, ".webp"));
        var previewPath = File.Exists(thumbnailPath) ? ToPublicPath(thumbnailPath) : ToPublicPath(path);
        var animatedPreviewPath = File.Exists(animatedVideoPath)
            ? ToPublicPath(animatedVideoPath)
            : Path.GetExtension(path).Equals(".webp", StringComparison.OrdinalIgnoreCase) && File.Exists(animatedThumbnailPath)
                ? ToPublicPath(animatedThumbnailPath)
                : previewPath;
        var baseName = Path.GetFileNameWithoutExtension(path);
        var videoPath = fullVideoSize is null
            ? string.Empty
            : Path.Combine(Path.GetDirectoryName(path)!, $"{baseName}__{fullVideoSize}__h264.mp4");

        return new CosmeticAssetResponse
        {
            Path = !string.IsNullOrEmpty(videoPath) && File.Exists(videoPath) ? ToPublicPath(videoPath) : ToPublicPath(path),
            PreviewPath = previewPath,
            AnimatedPreviewPath = animatedPreviewPath,
            Name = FormatName(baseName)
        };
    }

    private string GetRoot() => Path.GetFullPath(Path.Combine(
        environment.ContentRootPath,
        "..",
        "frontend",
        "public",
        "assets",
        "website",
        "profile-cosmetics"));

    private string ToPublicPath(string physicalPath)
    {
        var relativePath = Path.GetRelativePath(GetRoot(), physicalPath).Replace(Path.DirectorySeparatorChar, '/');
        return PublicPrefix + relativePath;
    }

    private static bool IsCoverImage(string path)
    {
        var name = Path.GetFileNameWithoutExtension(path);
        var extension = Path.GetExtension(path).ToLowerInvariant();
        return name.EndsWith("__cover", StringComparison.Ordinal)
            && (extension is ".webp" or ".jpeg" or ".jpg" or ".png");
    }

    private static string FormatName(string fileName)
    {
        var parts = fileName.Split("__", StringSplitOptions.RemoveEmptyEntries);
        return parts.Length > 1 ? parts[1].Replace('-', ' ') : fileName.Replace('-', ' ');
    }
}
