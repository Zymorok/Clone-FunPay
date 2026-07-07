using FunPay.Backend.DTOs;
using FunPay.Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace FunPay.Backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AuthService authService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<RegisterResponse>> Register(
        [FromBody] RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var result = await authService.RegisterAsync(request, cancellationToken);

        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, new { message = result.Message });
        }

        return StatusCode(StatusCodes.Status201Created, result.User);
    }
}
