using FunPay.Backend.DTOs;
using FunPay.Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace FunPay.Backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AuthService authService) : ControllerBase
{
    [HttpGet("availability/nick")]
    public async Task<ActionResult<AvailabilityResponse>> CheckNickAvailability(
        [FromQuery] string? value,
        CancellationToken cancellationToken)
    {
        return await authService.CheckNickAvailabilityAsync(value, cancellationToken);
    }

    [HttpGet("availability/email")]
    public async Task<ActionResult<AvailabilityResponse>> CheckEmailAvailability(
        [FromQuery] string? value,
        CancellationToken cancellationToken)
    {
        return await authService.CheckEmailAvailabilityAsync(value, cancellationToken);
    }

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
