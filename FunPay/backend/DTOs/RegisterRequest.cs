using System.ComponentModel.DataAnnotations;

namespace FunPay.Backend.DTOs;

public class RegisterRequest
{
    [Required(ErrorMessage = "Укажи ник.")]
    [StringLength(32, MinimumLength = 3, ErrorMessage = "Ник должен быть от 3 до 32 символов.")]
    public string Nick { get; set; } = string.Empty;

    [Required(ErrorMessage = "Укажи почту.")]
    [EmailAddress(ErrorMessage = "Почта выглядит неверно.")]
    [StringLength(254, ErrorMessage = "Почта слишком длинная.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Укажи пароль.")]
    [StringLength(100, MinimumLength = 8, ErrorMessage = "Пароль должен быть от 8 до 100 символов.")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Повтори пароль.")]
    public string ConfirmPassword { get; set; } = string.Empty;
}
