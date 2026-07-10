using FunPay.Backend.DTOs;
using FunPay.Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FunPay.Backend.Controllers;

[ApiController]
[Authorize]
[Route("api/team")]
public class TeamController(TeamManagementService teamManagementService) : ControllerBase
{
    [HttpGet("accounts")]
    public async Task<ActionResult<IReadOnlyList<TeamAccountResponse>>> SearchAccounts(
        [FromQuery] string? query,
        CancellationToken cancellationToken)
    {
        var result = await teamManagementService.SearchAsync(User, query, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Accounts)
            : StatusCode(result.StatusCode, new { message = result.Message });
    }

    [HttpPut("accounts/{accountId:int}/role")]
    public async Task<ActionResult<TeamAccountResponse>> UpdateRole(
        int accountId,
        [FromBody] UpdateTeamRoleRequest request,
        CancellationToken cancellationToken)
    {
        var result = await teamManagementService.UpdateRoleAsync(User, accountId, request, cancellationToken);
        return result.IsSuccess
            ? Ok(result.Account)
            : StatusCode(result.StatusCode, new { message = result.Message });
    }
}
