using System.ComponentModel.DataAnnotations;

namespace FunPay.Backend.DTOs;

public class ProfileContactRequest
{
    [Required]
    [StringLength(32)]
    public string Service { get; set; } = string.Empty;

    [StringLength(60)]
    public string? Title { get; set; }

    [Required]
    [StringLength(500)]
    public string Url { get; set; } = string.Empty;
}
