using System.ComponentModel.DataAnnotations;

namespace FunPay.Backend.DTOs;

public sealed class GoogleAuthRequest
{
    [Required]
    public string Credential { get; set; } = string.Empty;
}
