namespace FunPay.Backend.Models;

public class User
{
    public int Id { get; set; }

    // Ник нужен для входа и отображения на сайте.
    public string Nick { get; set; } = string.Empty;

    // Почта тоже подходит для входа.
    public string Email { get; set; } = string.Empty;

    // Тут хранится не пароль, а его безопасный отпечаток.
    public string PasswordHash { get; set; } = string.Empty;

    // Обычный пользователь или админ.
    public UserRole Role { get; set; } = UserRole.User;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Если true, пользователь больше не должен пользоваться сайтом.
    public bool IsBlocked { get; set; }

    public List<Product> Products { get; set; } = [];

    public List<Order> BuyerOrders { get; set; } = [];

    public List<Order> SellerOrders { get; set; } = [];

    public List<Message> Messages { get; set; } = [];
}
