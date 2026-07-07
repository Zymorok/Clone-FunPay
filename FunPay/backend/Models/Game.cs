namespace FunPay.Backend.Models;

public class Game
{
    public int Id { get; set; }

    // Название игры в каталоге.
    public string Name { get; set; } = string.Empty;

    // Картинка для карточки игры.
    public string? ImageUrl { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<Product> Products { get; set; } = [];
}
