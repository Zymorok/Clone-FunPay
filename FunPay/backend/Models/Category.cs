namespace FunPay.Backend.Models;

public class Category
{
    public int Id { get; set; }

    // Например: аккаунты, валюта, бустинг, услуги.
    public string Name { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<Product> Products { get; set; } = [];
}
