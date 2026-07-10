using System.ComponentModel.DataAnnotations;

namespace FunPay.Backend.DTOs;

public class RefreshTokenRequest
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}
