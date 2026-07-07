namespace FunPay.Backend.Models;

public class Order
{
    public int Id { get; set; }

    // Какое объявление купили.
    public int ProductId { get; set; }

    public Product? Product { get; set; }

    // Кто покупает.
    public int BuyerId { get; set; }

    public User? Buyer { get; set; }

    // Кто продает.
    public int SellerId { get; set; }

    public User? Seller { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.Created;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<Message> Messages { get; set; } = [];
}
