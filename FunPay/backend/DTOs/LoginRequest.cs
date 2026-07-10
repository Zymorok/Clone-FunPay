using System.ComponentModel.DataAnnotations;

namespace FunPay.Backend.DTOs;

public class LoginRequest
{
    [Required]
    [MinLength(3)]
    public string Identity { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;
}
