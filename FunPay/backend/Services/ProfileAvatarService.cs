using FunPay.Backend.Data;
using FunPay.Backend.Models;

namespace FunPay.Backend.Services;

public class ProfileAvatarService(
    AppDbContext dbContext,
    IWebHostEnvironment environment,
    ProfileMapper mapper)
{
    private const long MaxAvatarBytes = 5 * 1024 * 1024;

    public async Task<ProfileResult> UploadAsync(
        User user,
        IFormFile? file,
        CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0 || file.Length > MaxAvatarBytes)
        {
            return ProfileResult.Failure("Аватарка должна быть изображением до 5 МБ.", StatusCodes.Status400BadRequest);
        }

        var extension = file.ContentType switch
        {
            "image/jpeg" => ".jpg",
            "image/png" => ".png",
            "image/webp" => ".webp",
            _ => string.Empty
        };

        if (string.IsNullOrEmpty(extension))
        {
            return ProfileResult.Failure("Поддерживаются только JPG, PNG и WEBP.", StatusCodes.Status400BadRequest);
        }

        var avatarsDirectory = Path.Combine(environment.WebRootPath, "uploads", "avatars");
        Directory.CreateDirectory(avatarsDirectory);
        var fileName = $"{user.Id}-{Guid.NewGuid():N}{extension}";
        var destinationPath = Path.Combine(avatarsDirectory, fileName);

        await using (var stream = File.Create(destinationPath))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        DeletePrevious(user.AvatarUrl);
        user.AvatarUrl = $"/uploads/avatars/{fileName}";
        // Пользовательская загрузка всегда заменяет выбранную готовую аватарку.
        user.SelectedAvatarAsset = string.Empty;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);

        return ProfileResult.Success(mapper.Map(user));
    }

    private void DeletePrevious(string? avatarUrl)
    {
        if (string.IsNullOrEmpty(avatarUrl) || !avatarUrl.StartsWith("/uploads/avatars/", StringComparison.Ordinal))
        {
            return;
        }

        var fileName = Path.GetFileName(avatarUrl);
        var path = Path.Combine(environment.WebRootPath, "uploads", "avatars", fileName);

        if (File.Exists(path))
        {
            File.Delete(path);
        }
    }
}
