using FunPay.Backend.DTOs;
using FunPay.Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace FunPay.Backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    AuthService authService,
    GoogleAuthService googleAuthService,
    PasswordRecoveryService passwordRecoveryService,
    AccountSecurityService accountSecurityService) : ControllerBase
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

    [EnableRateLimiting("login-attempt")]
    [HttpPost("login")]
    public async Task<ActionResult> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken)
    {
        var result = await authService.LoginAsync(request, cancellationToken);

        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, new { message = result.Message });
        }

        return result.TwoFactorChallenge is not null
            ? Ok(result.TwoFactorChallenge)
            : Ok(result.Session);
    }

    [EnableRateLimiting("account-security-verify")]
    [HttpPost("login/two-factor")]
    public async Task<ActionResult<AuthResponse>> CompleteTwoFactorLogin(
        [FromBody] VerifySecurityCodeRequest request,
        CancellationToken cancellationToken)
    {
        var result = await authService.CompleteTwoFactorLoginAsync(request, cancellationToken);

        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, new { message = result.Message });
        }

        return Ok(result.Session);
    }

    [Authorize]
    [EnableRateLimiting("account-security-request")]
    [HttpPost("security/two-factor/request")]
    public async Task<ActionResult<SecurityChallengeResponse>> RequestTwoFactorToggle(
        [FromBody] TwoFactorToggleRequest request,
        CancellationToken cancellationToken)
    {
        var result = await accountSecurityService.StartTwoFactorToggleAsync(User, request, cancellationToken);
        return SecurityResponse(result);
    }

    [Authorize]
    [EnableRateLimiting("account-security-verify")]
    [HttpPost("security/two-factor/confirm")]
    public async Task<ActionResult<TwoFactorStatusResponse>> ConfirmTwoFactorToggle(
        [FromBody] VerifySecurityCodeRequest request,
        CancellationToken cancellationToken)
    {
        var result = await accountSecurityService.CompleteTwoFactorToggleAsync(User, request, cancellationToken);
        return SecurityResponse(result);
    }

    [Authorize]
    [EnableRateLimiting("account-security-request")]
    [HttpPost("security/email-change/request")]
    public async Task<ActionResult<SecurityChallengeResponse>> RequestEmailChange(
        [FromBody] EmailChangeRequest request,
        CancellationToken cancellationToken)
    {
        var result = await accountSecurityService.StartEmailChangeAsync(User, request, cancellationToken);
        return SecurityResponse(result);
    }

    [Authorize]
    [EnableRateLimiting("account-security-verify")]
    [HttpPost("security/email-change/verify-current")]
    public async Task<ActionResult<SecurityChallengeResponse>> VerifyCurrentEmail(
        [FromBody] VerifyCurrentEmailRequest request,
        CancellationToken cancellationToken)
    {
        var result = await accountSecurityService.VerifyCurrentEmailAsync(User, request, cancellationToken);
        return SecurityResponse(result);
    }

    [Authorize]
    [EnableRateLimiting("account-security-verify")]
    [HttpPost("security/email-change/confirm")]
    public async Task<ActionResult<EmailChangeCompletedResponse>> ConfirmEmailChange(
        [FromBody] VerifySecurityCodeRequest request,
        CancellationToken cancellationToken)
    {
        var result = await accountSecurityService.CompleteEmailChangeAsync(User, request, cancellationToken);
        return SecurityResponse(result);
    }

    [Authorize]
    [EnableRateLimiting("account-security-request")]
    [HttpPost("security/password/change")]
    public async Task<ActionResult<PasswordChangeResponse>> ChangePassword(
        [FromBody] PasswordChangeRequest request,
        CancellationToken cancellationToken)
    {
        var result = await accountSecurityService.StartPasswordChangeAsync(User, request, cancellationToken);

        if (!result.IsSuccess || result.Value is null)
        {
            return StatusCode(result.StatusCode, new { message = result.Message });
        }

        if (result.Value.Challenge is { } challenge)
        {
            return Ok(new PasswordChangeResponse
            {
                RequiresCode = true,
                ChallengeToken = challenge.Token,
                ExpiresAt = challenge.ExpiresAt
            });
        }

        var session = await authService.IssueSessionForUserAsync(
            result.Value.User!,
            cancellationToken);
        return Ok(new PasswordChangeResponse { Session = session });
    }

    [Authorize]
    [EnableRateLimiting("account-security-verify")]
    [HttpPost("security/password/confirm")]
    public async Task<ActionResult<AuthResponse>> ConfirmPasswordChange(
        [FromBody] VerifySecurityCodeRequest request,
        CancellationToken cancellationToken)
    {
        var result = await accountSecurityService.CompletePasswordChangeAsync(
            User,
            request,
            cancellationToken);

        if (!result.IsSuccess || result.Value is null)
        {
            return StatusCode(result.StatusCode, new { message = result.Message });
        }

        return Ok(await authService.IssueSessionForUserAsync(result.Value, cancellationToken));
    }

    [Authorize]
    [EnableRateLimiting("account-security-request")]
    [HttpPost("security/manage/{identifier}/password")]
    public async Task<ActionResult<SecurityActionCompletedResponse>> ChangeManagedPassword(
        string identifier,
        [FromBody] ManagedPasswordChangeRequest request,
        CancellationToken cancellationToken)
    {
        return SecurityResponse(await accountSecurityService.ChangeManagedPasswordAsync(
            User,
            identifier,
            request,
            cancellationToken));
    }

    [Authorize]
    [EnableRateLimiting("account-security-request")]
    [HttpPost("security/manage/{identifier}/two-factor")]
    public async Task<ActionResult<TwoFactorStatusResponse>> ChangeManagedTwoFactor(
        string identifier,
        [FromBody] TwoFactorToggleRequest request,
        CancellationToken cancellationToken)
    {
        return SecurityResponse(await accountSecurityService.ChangeManagedTwoFactorAsync(
            User,
            identifier,
            request,
            cancellationToken));
    }

    [Authorize]
    [EnableRateLimiting("account-security-request")]
    [HttpPost("security/manage/{identifier}/email")]
    public async Task<ActionResult<EmailChangeCompletedResponse>> ChangeManagedEmail(
        string identifier,
        [FromBody] EmailChangeRequest request,
        CancellationToken cancellationToken)
    {
        return SecurityResponse(await accountSecurityService.ChangeManagedEmailAsync(
            User,
            identifier,
            request,
            cancellationToken));
    }

    [HttpGet("google/config")]
    public ActionResult<GoogleAuthConfigResponse> GetGoogleConfig()
    {
        return googleAuthService.GetPublicConfig();
    }

    [HttpPost("google")]
    public async Task<ActionResult<AuthResponse>> Google(
        [FromBody] GoogleAuthRequest request,
        CancellationToken cancellationToken)
    {
        var result = await googleAuthService.AuthenticateAsync(request, cancellationToken);

        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, new { message = result.Message });
        }

        return Ok(result.Session);
    }

    [EnableRateLimiting("password-recovery-request")]
    [HttpPost("password/recovery/request")]
    public async Task<ActionResult<PasswordRecoveryAcceptedResponse>> RequestPasswordRecovery(
        [FromBody] PasswordRecoveryRequest request,
        CancellationToken cancellationToken)
    {
        await passwordRecoveryService.RequestCodeAsync(request, cancellationToken);
        return Accepted(new PasswordRecoveryAcceptedResponse
        {
            Message = PasswordRecoveryService.AcceptedMessage
        });
    }

    [EnableRateLimiting("password-recovery-verify")]
    [HttpPost("password/recovery/verify")]
    public async Task<ActionResult<PasswordRecoveryVerifiedResponse>> VerifyPasswordRecovery(
        [FromBody] PasswordRecoveryCodeRequest request,
        CancellationToken cancellationToken)
    {
        var result = await passwordRecoveryService.VerifyCodeAsync(request, cancellationToken);

        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, new { message = result.Message });
        }

        return Ok(result.Verification);
    }

    [EnableRateLimiting("password-recovery-verify")]
    [HttpPost("password/recovery/login")]
    public async Task<ActionResult<AuthResponse>> LoginWithRecoveryTicket(
        [FromBody] PasswordRecoveryTicketRequest request,
        CancellationToken cancellationToken)
    {
        var result = await passwordRecoveryService.LoginAsync(request, cancellationToken);

        if (!result.IsSuccess)
        {
            return StatusCode(result.StatusCode, new { message = result.Message });
        }

        return Ok(result.Session);
    }

    [EnableRateLimiting("password-recovery-verify")]
    [HttpPost("password/recovery/reset")]
    public async Task<ActionResult<AuthResponse>> ResetPasswordWithRecoveryTicket(
        [FromBody] PasswordRecoveryResetRequest request,
        CancellationToken cancellationToken)
    {
        var result = await passwordRecoveryService.ResetPasswordAsync(request, cancellationToken);

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

    private ActionResult<T> SecurityResponse<T>(AccountSecurityResult<T> result) where T : class
    {
        return result.IsSuccess && result.Value is not null
            ? Ok(result.Value)
            : StatusCode(result.StatusCode, new { message = result.Message });
    }
}
