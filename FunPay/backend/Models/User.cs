namespace FunPay.Backend.Models;

public class User
{
    public int Id { get; set; }

    // Публичный девятизначный идентификатор нужен для точного поиска аккаунта и выдачи доступа.
    public string PublicId { get; set; } = string.Empty;

    // Ник сохраняет выбранный пользователем регистр и показывается на сайте.
    public string Nick { get; set; } = string.Empty;

    // Нормализованный ник нужен для входа, поиска и проверки уникальности.
    public string NormalizedNick { get; set; } = string.Empty;

    // Почта тоже подходит для входа.
    public string Email { get; set; } = string.Empty;

    // Тут хранится не пароль, а его безопасный отпечаток.
    public string PasswordHash { get; set; } = string.Empty;

    // Уникальный ID Google позволяет узнавать аккаунт даже после смены почты в Google.
    public string? GoogleSubject { get; set; }

    // При обычном входе после пароля потребуется одноразовый код из письма.
    public bool IsEmailTwoFactorEnabled { get; set; }

    // Обычный пользователь или админ.
    public UserRole Role { get; set; } = UserRole.User;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Если пользователь заблокирован, он больше не должен пользоваться сайтом.
    public bool IsBlocked { get; set; }

    public DateTimeOffset? LastLoginAt { get; set; }

    // Последняя проверка активности показывает, открыт ли сайт у пользователя.
    public DateTimeOffset? LastSeenAt { get; set; }

    // Последнее реальное действие отличает активного пользователя от АФК.
    public DateTimeOffset? LastActiveAt { get; set; }

    // Данные публичного профиля пользователя.
    public string? Description { get; set; }

    public string? Gender { get; set; }

    public DateOnly? BirthDate { get; set; }

    public string? CountryCode { get; set; }

    public string? AvatarUrl { get; set; }

    public string AvatarStyle { get; set; } = "gold";

    public string BannerStyle { get; set; } = "midnight";

    public string FrameStyle { get; set; } = "gold";

    public string? SelectedAvatarAsset { get; set; }

    public string? SelectedBannerAsset { get; set; }

    public string? SelectedFrameAsset { get; set; }

    public string? SelectedWallpaperAsset { get; set; }

    public List<ProfileContact> ProfileContacts { get; set; } = [];

    public List<UserSession> Sessions { get; set; } = [];

    public List<PasswordRecoveryCode> PasswordRecoveryCodes { get; set; } = [];

    public List<AccountSecurityChallenge> AccountSecurityChallenges { get; set; } = [];

    public List<Product> Products { get; set; } = [];

    public List<Order> BuyerOrders { get; set; } = [];

    public List<Order> SellerOrders { get; set; } = [];

    public List<Message> Messages { get; set; } = [];
}
