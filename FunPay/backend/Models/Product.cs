namespace FunPay.Backend.Models;

public class Product
{
    public int Id { get; set; }

    // Кто создал объявление.
    public int SellerId { get; set; }

    public User? Seller { get; set; }

    // К какой игре относится объявление.
    public int GameId { get; set; }

    public Game? Game { get; set; }

    // Какой тип услуги продается.
    public int CategoryId { get; set; }

    public Category? Category { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public decimal Price { get; set; }

    public ProductStatus Status { get; set; } = ProductStatus.Active;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<Order> Orders { get; set; } = [];
}
