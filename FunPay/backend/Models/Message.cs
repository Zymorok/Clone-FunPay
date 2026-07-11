namespace FunPay.Backend.Models;

public class Message
{
    public int Id { get; set; }

    // Сообщение всегда относится к заказу.
    public int OrderId { get; set; }

    public Order? Order { get; set; }

    // Кто написал сообщение.
    public int SenderId { get; set; }

    public User? Sender { get; set; }

    public string Text { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    // В чате заказа получатель всегда один, поэтому одной отметки достаточно.
    public DateTimeOffset? ReadAt { get; set; }
}
