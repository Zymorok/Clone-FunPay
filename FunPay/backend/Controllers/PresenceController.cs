using FunPay.Backend.DTOs;
using FunPay.Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FunPay.Backend.Controllers;

[ApiController]
[Route("api/presence")]
public class PresenceController(PresenceService presenceService) : ControllerBase
{
    [Authorize]
    [HttpPost("heartbeat")]
    public async Task<ActionResult<PresenceResponse>> Heartbeat(
        [FromBody] PresenceHeartbeatRequest request,
        CancellationToken cancellationToken)
    {
        var response = await presenceService.HeartbeatAsync(
            User,
            request.IsActive,
            cancellationToken);

        return response is null
            ? Unauthorized(new { message = "Сессия истекла. Войдите снова." })
            : Ok(response);
    }

    [AllowAnonymous]
    [HttpGet("{normalizedNick}")]
    public async Task<ActionResult<PresenceResponse>> Get(
        string normalizedNick,
        CancellationToken cancellationToken)
    {
        var response = await presenceService.GetByNormalizedNickAsync(
            normalizedNick,
            cancellationToken);

        return response is null
            ? NotFound(new { message = "Профиль не найден." })
            : Ok(response);
    }
}
