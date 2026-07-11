using FunPay.Backend.DTOs;
using FunPay.Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FunPay.Backend.Controllers;

[ApiController]
[Authorize]
[Route("api/profile")]
public class ProfileController(ProfileService profileService) : ControllerBase
{
    [HttpGet("cosmetics")]
    public ActionResult<CosmeticCatalogResponse> GetCosmetics()
    {
        return Ok(profileService.GetCosmetics());
    }

    [HttpGet("me")]
    public async Task<ActionResult<ProfileResponse>> GetMyProfile(CancellationToken cancellationToken)
    {
        return ToActionResult(await profileService.GetAsync(User, cancellationToken));
    }

    [AllowAnonymous]
    [HttpGet("{identifier}")]
    public async Task<ActionResult<ProfileResponse>> GetPublicProfile(
        string identifier,
        CancellationToken cancellationToken)
    {
        return ToActionResult(await profileService.GetPublicAsync(User, identifier, cancellationToken));
    }

    [HttpPut("me")]
    public async Task<ActionResult<ProfileResponse>> UpdateMyProfile(
        [FromBody] UpdateProfileRequest request,
        CancellationToken cancellationToken)
    {
        return ToActionResult(await profileService.UpdateAsync(User, request, cancellationToken));
    }

    [HttpPut("{identifier}")]
    public async Task<ActionResult<ProfileResponse>> UpdateProfile(
        string identifier,
        [FromBody] UpdateProfileRequest request,
        CancellationToken cancellationToken)
    {
        return ToActionResult(await profileService.UpdateByIdentifierAsync(
            User,
            identifier,
            request,
            cancellationToken));
    }

    [HttpPost("me/avatar")]
    public async Task<ActionResult<ProfileResponse>> UploadAvatar(
        IFormFile? file,
        CancellationToken cancellationToken)
    {
        return ToActionResult(await profileService.UploadAvatarAsync(User, file, cancellationToken));
    }

    [HttpPost("{identifier}/avatar")]
    public async Task<ActionResult<ProfileResponse>> UploadAvatar(
        string identifier,
        IFormFile? file,
        CancellationToken cancellationToken)
    {
        return ToActionResult(await profileService.UploadAvatarByIdentifierAsync(
            User,
            identifier,
            file,
            cancellationToken));
    }

    private ActionResult<ProfileResponse> ToActionResult(ProfileResult result)
    {
        return result.IsSuccess
            ? Ok(result.Profile)
            : StatusCode(result.StatusCode, new { message = result.Message });
    }
}
