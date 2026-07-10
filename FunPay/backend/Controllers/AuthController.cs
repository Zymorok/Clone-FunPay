using FunPay.Backend.DTOs;
using FunPay.Backend.Services;
using Microsoft.AspNetCore.Authorization;
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
    public async Task<ActionResult<AuthResponse>> Register(
        [FromBody] RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var result = await authService.RegisterAsync(request, cancellationToken);

        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, new { message = result.Message });
        }

        return StatusCode(StatusCodes.Status201Created, result.Session);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken)
    {
        var result = await authService.LoginAsync(request, cancellationToken);

        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, new { message = result.Message });
        }

        return Ok(result.Session);
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh(
        [FromBody] RefreshTokenRequest request,
        CancellationToken cancellationToken)
    {
        var result = await authService.RefreshAsync(request, cancellationToken);

        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, new { message = result.Message });
        }

        return Ok(result.Session);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<RegisterResponse>> Me(CancellationToken cancellationToken)
    {
        var user = await authService.GetCurrentUserAsync(User, cancellationToken);

        if (user is null)
        {
            return Unauthorized(new { message = "Сессия истекла. Войдите снова." });
        }

        return user;
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(
        [FromBody] LogoutRequest? request,
        CancellationToken cancellationToken)
    {
        await authService.LogoutAsync(request ?? new LogoutRequest(), User, cancellationToken);
        return NoContent();
    }
}
