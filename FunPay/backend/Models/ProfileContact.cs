namespace FunPay.Backend.Models;

public class ProfileContact
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string Service { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Url { get; set; } = string.Empty;

    public int Position { get; set; }

    public User User { get; set; } = null!;
}
