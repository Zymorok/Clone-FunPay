using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using FunPay.Backend.Data;
using FunPay.Backend.DTOs;
using FunPay.Backend.Models;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace FunPay.Backend.Services;

public sealed class AccountSecurityService(
    AppDbContext dbContext,
    IEmailQueue emailQueue,
    IPasswordHasher<User> passwordHasher,
    ProfileUserResolver profileUsers,
    IConfiguration configuration)
{
    private const string LoginPurpose = "login-two-factor";
    private const string TogglePurpose = "two-factor-toggle";
    private const string CurrentEmailPurpose = "email-change-current";
    private const string NewEmailPurpose = "email-change-new";
    private const string PasswordChangePurpose = "password-change";
    private const int CodeLifetimeMinutes = 15;
    private const int MaximumFailedAttempts = 5;
    private static readonly TimeSpan RequestCooldown = TimeSpan.FromMinutes(1);

    public async Task<AccountSecurityResult<SecurityChallengeResponse>> StartLoginAsync(
        User user,
        string? language,
        CancellationToken cancellationToken)
    {
        var created = await CreateChallengeAsync(user, LoginPurpose, cancellationToken);

        if (created is null)
        {
            return CodeAlreadySent<SecurityChallengeResponse>();
        }

        emailQueue.TryQueue(BuildCodeEmail(language, user.Email, created.Code, LoginPurpose));
        return AccountSecurityResult<SecurityChallengeResponse>.Success(created.Response);
    }

    public async Task<AccountSecurityResult<User>> CompleteLoginAsync(
        VerifySecurityCodeRequest request,
        CancellationToken cancellationToken)
    {
        var validation = await ValidateChallengeAsync(request, LoginPurpose, null, cancellationToken);

        if (!validation.IsSuccess || validation.Value is null)
        {
            return AccountSecurityResult<User>.Failure(validation.Message, validation.StatusCode);
        }

        var challenge = validation.Value;

        if (!await TryClaimAsync(challenge.Id, cancellationToken))
        {
            return InvalidCode<User>();
        }

        return AccountSecurityResult<User>.Success(challenge.User);
    }

    public async Task<AccountSecurityResult<SecurityChallengeResponse>> StartTwoFactorToggleAsync(
        ClaimsPrincipal principal,
        TwoFactorToggleRequest request,
        CancellationToken cancellationToken)
    {
        var user = await ResolveUserAsync(principal, cancellationToken);

        if (user is null)
        {
            return Unauthorized<SecurityChallengeResponse>();
        }

        if (user.IsEmailTwoFactorEnabled == request.Enabled)
        {
            return AccountSecurityResult<SecurityChallengeResponse>.Failure(
                request.Enabled ? "Двухфакторная защита уже включена." : "Двухфакторная защита уже выключена.",
                StatusCodes.Status409Conflict);
        }

        var created = await CreateChallengeAsync(
            user,
            TogglePurpose,
            cancellationToken,
            pendingTwoFactorEnabled: request.Enabled);

        if (created is null)
        {
            return CodeAlreadySent<SecurityChallengeResponse>();
        }

        emailQueue.TryQueue(BuildCodeEmail(request.Language, user.Email, created.Code, TogglePurpose));
        return AccountSecurityResult<SecurityChallengeResponse>.Success(created.Response);
    }

    public async Task<AccountSecurityResult<TwoFactorStatusResponse>> CompleteTwoFactorToggleAsync(
        ClaimsPrincipal principal,
        VerifySecurityCodeRequest request,
        CancellationToken cancellationToken)
    {
        var user = await ResolveUserAsync(principal, cancellationToken);

        if (user is null)
        {
            return Unauthorized<TwoFactorStatusResponse>();
        }

        var validation = await ValidateChallengeAsync(request, TogglePurpose, user.Id, cancellationToken);

        if (!validation.IsSuccess || validation.Value is null)
        {
            return AccountSecurityResult<TwoFactorStatusResponse>.Failure(validation.Message, validation.StatusCode);
        }

        var challenge = validation.Value;

        if (challenge.PendingTwoFactorEnabled is null)
        {
            return InvalidCode<TwoFactorStatusResponse>();
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        if (!await TryClaimAsync(challenge.Id, cancellationToken))
        {
            return InvalidCode<TwoFactorStatusResponse>();
        }

        user.IsEmailTwoFactorEnabled = challenge.PendingTwoFactorEnabled.Value;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return AccountSecurityResult<TwoFactorStatusResponse>.Success(new TwoFactorStatusResponse
        {
            Enabled = user.IsEmailTwoFactorEnabled
        });
    }

    public async Task<AccountSecurityResult<PasswordChangeOutcome>> StartPasswordChangeAsync(
        ClaimsPrincipal principal,
        PasswordChangeRequest request,
        CancellationToken cancellationToken)
    {
        var user = await ResolveUserAsync(principal, cancellationToken);

        if (user is null)
        {
            return Unauthorized<PasswordChangeOutcome>();
        }

        if (request.NewPassword != request.ConfirmPassword)
        {
            return AccountSecurityResult<PasswordChangeOutcome>.Failure("Новые пароли не совпадают.");
        }

        if (passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.CurrentPassword)
            == PasswordVerificationResult.Failed)
        {
            return AccountSecurityResult<PasswordChangeOutcome>.Failure("Текущий пароль неверный.");
        }

        if (passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.NewPassword)
            != PasswordVerificationResult.Failed)
        {
            return AccountSecurityResult<PasswordChangeOutcome>.Failure(
                "Новый пароль должен отличаться от текущего.");
        }

        var pendingPasswordHash = passwordHasher.HashPassword(user, request.NewPassword);

        if (user.IsEmailTwoFactorEnabled)
        {
            var created = await CreateChallengeAsync(
                user,
                PasswordChangePurpose,
                cancellationToken,
                pendingPasswordHash: pendingPasswordHash);

            if (created is null)
            {
                return CodeAlreadySent<PasswordChangeOutcome>();
            }

            emailQueue.TryQueue(BuildCodeEmail(
                request.Language,
                user.Email,
                created.Code,
                PasswordChangePurpose));
            return AccountSecurityResult<PasswordChangeOutcome>.Success(
                new PasswordChangeOutcome(null, created.Response));
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        await ApplyPasswordHashAsync(user, pendingPasswordHash, cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        emailQueue.TryQueue(BuildPasswordChangedNotice(user.Email));

        return AccountSecurityResult<PasswordChangeOutcome>.Success(
            new PasswordChangeOutcome(user, null));
    }

    public async Task<AccountSecurityResult<User>> CompletePasswordChangeAsync(
        ClaimsPrincipal principal,
        VerifySecurityCodeRequest request,
        CancellationToken cancellationToken)
    {
        var user = await ResolveUserAsync(principal, cancellationToken);

        if (user is null)
        {
            return Unauthorized<User>();
        }

        var validation = await ValidateChallengeAsync(
            request,
            PasswordChangePurpose,
            user.Id,
            cancellationToken);

        if (!validation.IsSuccess || validation.Value?.PendingPasswordHash is null)
        {
            return AccountSecurityResult<User>.Failure(validation.Message, validation.StatusCode);
        }

        var challenge = validation.Value;
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        if (!await TryClaimAsync(challenge.Id, cancellationToken))
        {
            return InvalidCode<User>();
        }

        await ApplyPasswordHashAsync(user, challenge.PendingPasswordHash, cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        emailQueue.TryQueue(BuildPasswordChangedNotice(user.Email));

        return AccountSecurityResult<User>.Success(user);
    }

    public async Task<AccountSecurityResult<SecurityChallengeResponse>> StartEmailChangeAsync(
        ClaimsPrincipal principal,
        EmailChangeRequest request,
        CancellationToken cancellationToken)
    {
        var user = await ResolveUserAsync(principal, cancellationToken);

        if (user is null)
        {
            return Unauthorized<SecurityChallengeResponse>();
        }

        var newEmail = NormalizeEmail(request.NewEmail);

        if (newEmail == user.Email)
        {
            return AccountSecurityResult<SecurityChallengeResponse>.Failure("Укажите другую почту.");
        }

        if (await dbContext.Users.AnyAsync(current => current.Email == newEmail, cancellationToken))
        {
            return AccountSecurityResult<SecurityChallengeResponse>.Failure(
                "Такая почта уже занята.",
                StatusCodes.Status409Conflict);
        }

        var created = await CreateChallengeAsync(
            user,
            CurrentEmailPurpose,
            cancellationToken,
            pendingEmail: newEmail);

        if (created is null)
        {
            return CodeAlreadySent<SecurityChallengeResponse>();
        }

        emailQueue.TryQueue(BuildCodeEmail(request.Language, user.Email, created.Code, CurrentEmailPurpose));
        return AccountSecurityResult<SecurityChallengeResponse>.Success(created.Response);
    }

    public async Task<AccountSecurityResult<SecurityChallengeResponse>> VerifyCurrentEmailAsync(
        ClaimsPrincipal principal,
        VerifyCurrentEmailRequest request,
        CancellationToken cancellationToken)
    {
        var user = await ResolveUserAsync(principal, cancellationToken);

        if (user is null)
        {
            return Unauthorized<SecurityChallengeResponse>();
        }

        var validation = await ValidateChallengeAsync(request, CurrentEmailPurpose, user.Id, cancellationToken);

        if (!validation.IsSuccess || validation.Value?.PendingEmail is null)
        {
            return AccountSecurityResult<SecurityChallengeResponse>.Failure(validation.Message, validation.StatusCode);
        }

        var currentChallenge = validation.Value;

        if (await dbContext.Users.AnyAsync(
                current => current.Id != user.Id && current.Email == currentChallenge.PendingEmail,
                cancellationToken))
        {
            return AccountSecurityResult<SecurityChallengeResponse>.Failure(
                "Такая почта уже занята.",
                StatusCodes.Status409Conflict);
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        if (!await TryClaimAsync(currentChallenge.Id, cancellationToken))
        {
            return InvalidCode<SecurityChallengeResponse>();
        }

        var created = await CreateChallengeAsync(
            user,
            NewEmailPurpose,
            cancellationToken,
            pendingEmail: currentChallenge.PendingEmail);

        if (created is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return CodeAlreadySent<SecurityChallengeResponse>();
        }

        await transaction.CommitAsync(cancellationToken);

        emailQueue.TryQueue(BuildCodeEmail(request.Language, currentChallenge.PendingEmail, created.Code, NewEmailPurpose));
        return AccountSecurityResult<SecurityChallengeResponse>.Success(created.Response);
    }

    public async Task<AccountSecurityResult<EmailChangeCompletedResponse>> CompleteEmailChangeAsync(
        ClaimsPrincipal principal,
        VerifySecurityCodeRequest request,
        CancellationToken cancellationToken)
    {
        var user = await ResolveUserAsync(principal, cancellationToken);

        if (user is null)
        {
            return Unauthorized<EmailChangeCompletedResponse>();
        }

        var validation = await ValidateChallengeAsync(request, NewEmailPurpose, user.Id, cancellationToken);

        if (!validation.IsSuccess || validation.Value?.PendingEmail is null)
        {
            return AccountSecurityResult<EmailChangeCompletedResponse>.Failure(validation.Message, validation.StatusCode);
        }

        var challenge = validation.Value;
        var newEmail = challenge.PendingEmail;

        if (await dbContext.Users.AnyAsync(
                current => current.Id != user.Id && current.Email == newEmail,
                cancellationToken))
        {
            return AccountSecurityResult<EmailChangeCompletedResponse>.Failure(
                "Такая почта уже занята.",
                StatusCodes.Status409Conflict);
        }

        var oldEmail = user.Email;
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        if (!await TryClaimAsync(challenge.Id, cancellationToken))
        {
            return InvalidCode<EmailChangeCompletedResponse>();
        }

        var now = DateTimeOffset.UtcNow;

        // NOTE: После смены почты старые коды входа и восстановления больше не должны работать.
        await dbContext.AccountSecurityChallenges
            .Where(current => current.UserId == user.Id && current.UsedAt == null)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(current => current.UsedAt, now),
                cancellationToken);
        await dbContext.PasswordRecoveryCodes
            .Where(current => current.UserId == user.Id && current.UsedAt == null)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(current => current.UsedAt, now),
                cancellationToken);

        user.Email = newEmail;
        user.UpdatedAt = now;

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (
            exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            await transaction.RollbackAsync(cancellationToken);
            return AccountSecurityResult<EmailChangeCompletedResponse>.Failure(
                "Такая почта уже занята.",
                StatusCodes.Status409Conflict);
        }

        emailQueue.TryQueue(BuildEmailChangedNotice(oldEmail));
        emailQueue.TryQueue(BuildEmailChangedNotice(newEmail));

        return AccountSecurityResult<EmailChangeCompletedResponse>.Success(new EmailChangeCompletedResponse
        {
            Email = user.Email,
            TwoFactorEnabled = user.IsEmailTwoFactorEnabled
        });
    }

    public async Task<AccountSecurityResult<SecurityActionCompletedResponse>> ChangeManagedPasswordAsync(
        ClaimsPrincipal principal,
        string? identifier,
        ManagedPasswordChangeRequest request,
        CancellationToken cancellationToken)
    {
        var managed = await ResolveManagedTargetAsync(principal, identifier, cancellationToken);

        if (!managed.IsSuccess || managed.Value is null)
        {
            return AccountSecurityResult<SecurityActionCompletedResponse>.Failure(
                managed.Message,
                managed.StatusCode);
        }

        if (request.NewPassword != request.ConfirmPassword)
        {
            return AccountSecurityResult<SecurityActionCompletedResponse>.Failure(
                "Новые пароли не совпадают.");
        }

        var target = managed.Value.Target;

        if (passwordHasher.VerifyHashedPassword(target, target.PasswordHash, request.NewPassword)
            != PasswordVerificationResult.Failed)
        {
            return AccountSecurityResult<SecurityActionCompletedResponse>.Failure(
                "Новый пароль должен отличаться от текущего.");
        }

        var passwordHash = passwordHasher.HashPassword(target, request.NewPassword);
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        await ApplyPasswordHashAsync(target, passwordHash, cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        emailQueue.TryQueue(BuildPasswordChangedNotice(target.Email));

        return AccountSecurityResult<SecurityActionCompletedResponse>.Success(
            new SecurityActionCompletedResponse());
    }

    public async Task<AccountSecurityResult<TwoFactorStatusResponse>> ChangeManagedTwoFactorAsync(
        ClaimsPrincipal principal,
        string? identifier,
        TwoFactorToggleRequest request,
        CancellationToken cancellationToken)
    {
        var managed = await ResolveManagedTargetAsync(principal, identifier, cancellationToken);

        if (!managed.IsSuccess || managed.Value is null)
        {
            return AccountSecurityResult<TwoFactorStatusResponse>.Failure(
                managed.Message,
                managed.StatusCode);
        }

        var target = managed.Value.Target;
        var now = DateTimeOffset.UtcNow;
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        await InvalidateAccountChallengesAsync(target.Id, now, cancellationToken);
        target.IsEmailTwoFactorEnabled = request.Enabled;
        target.UpdatedAt = now;
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return AccountSecurityResult<TwoFactorStatusResponse>.Success(new TwoFactorStatusResponse
        {
            Enabled = target.IsEmailTwoFactorEnabled
        });
    }

    public async Task<AccountSecurityResult<EmailChangeCompletedResponse>> ChangeManagedEmailAsync(
        ClaimsPrincipal principal,
        string? identifier,
        EmailChangeRequest request,
        CancellationToken cancellationToken)
    {
        var managed = await ResolveManagedTargetAsync(principal, identifier, cancellationToken);

        if (!managed.IsSuccess || managed.Value is null)
        {
            return AccountSecurityResult<EmailChangeCompletedResponse>.Failure(
                managed.Message,
                managed.StatusCode);
        }

        var target = managed.Value.Target;
        var newEmail = NormalizeEmail(request.NewEmail);

        if (newEmail == target.Email)
        {
            return AccountSecurityResult<EmailChangeCompletedResponse>.Failure("Укажите другую почту.");
        }

        if (await dbContext.Users.AnyAsync(
                current => current.Id != target.Id && current.Email == newEmail,
                cancellationToken))
        {
            return AccountSecurityResult<EmailChangeCompletedResponse>.Failure(
                "Такая почта уже занята.",
                StatusCodes.Status409Conflict);
        }

        var oldEmail = target.Email;
        var now = DateTimeOffset.UtcNow;
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        await InvalidateSecurityStateAsync(target.Id, now, revokeSessions: true, cancellationToken);
        target.Email = newEmail;
        target.UpdatedAt = now;

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (
            exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            await transaction.RollbackAsync(cancellationToken);
            return AccountSecurityResult<EmailChangeCompletedResponse>.Failure(
                "Такая почта уже занята.",
                StatusCodes.Status409Conflict);
        }

        emailQueue.TryQueue(BuildEmailChangedNotice(oldEmail));
        emailQueue.TryQueue(BuildEmailChangedNotice(newEmail));

        return AccountSecurityResult<EmailChangeCompletedResponse>.Success(new EmailChangeCompletedResponse
        {
            Email = target.Email,
            TwoFactorEnabled = target.IsEmailTwoFactorEnabled
        });
    }

    private async Task<CreatedChallenge?> CreateChallengeAsync(
        User user,
        string purpose,
        CancellationToken cancellationToken,
        string? pendingEmail = null,
        bool? pendingTwoFactorEnabled = null,
        string? pendingPasswordHash = null)
    {
        var now = DateTimeOffset.UtcNow;
        var recentChallengeExists = await dbContext.AccountSecurityChallenges.AnyAsync(
            challenge => challenge.UserId == user.Id
                && challenge.Purpose == purpose
                && challenge.UsedAt == null
                && challenge.CreatedAt > now.Subtract(RequestCooldown),
            cancellationToken);

        if (recentChallengeExists)
        {
            return null;
        }

        await dbContext.AccountSecurityChallenges
            .Where(challenge => challenge.UserId == user.Id
                && challenge.Purpose == purpose
                && challenge.UsedAt == null)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(challenge => challenge.UsedAt, now),
                cancellationToken);

        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        var token = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(48));
        var expiresAt = now.AddMinutes(CodeLifetimeMinutes);
        dbContext.AccountSecurityChallenges.Add(new AccountSecurityChallenge
        {
            UserId = user.Id,
            Purpose = purpose,
            CodeHash = HashCode(user.Id, purpose, code),
            TokenHash = HashToken(token),
            PendingEmail = pendingEmail,
            PendingTwoFactorEnabled = pendingTwoFactorEnabled,
            PendingPasswordHash = pendingPasswordHash,
            CreatedAt = now,
            ExpiresAt = expiresAt
        });
        await dbContext.SaveChangesAsync(cancellationToken);

        return new CreatedChallenge(
            new SecurityChallengeResponse { Token = token, ExpiresAt = expiresAt },
            code);
    }

    private async Task<AccountSecurityResult<AccountSecurityChallenge>> ValidateChallengeAsync(
        VerifySecurityCodeRequest request,
        string purpose,
        int? userId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Token))
        {
            return InvalidCode<AccountSecurityChallenge>();
        }

        var tokenHash = HashToken(request.Token.Trim());
        var now = DateTimeOffset.UtcNow;
        var challenge = await dbContext.AccountSecurityChallenges
            .Include(current => current.User)
            .FirstOrDefaultAsync(
                current => current.TokenHash == tokenHash && current.Purpose == purpose,
                cancellationToken);

        if (challenge is null
            || challenge.UsedAt is not null
            || challenge.ExpiresAt <= now
            || challenge.FailedAttempts >= MaximumFailedAttempts
            || (userId.HasValue && challenge.UserId != userId.Value))
        {
            return InvalidCode<AccountSecurityChallenge>();
        }

        var actualHash = HashCode(challenge.UserId, purpose, request.Code);

        if (!HashesMatch(challenge.CodeHash, actualHash))
        {
            challenge.FailedAttempts += 1;

            if (challenge.FailedAttempts >= MaximumFailedAttempts)
            {
                challenge.UsedAt = now;
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            return InvalidCode<AccountSecurityChallenge>();
        }

        if (challenge.User.IsBlocked)
        {
            return AccountSecurityResult<AccountSecurityChallenge>.Failure(
                "Аккаунт заблокирован.",
                StatusCodes.Status403Forbidden);
        }

        return AccountSecurityResult<AccountSecurityChallenge>.Success(challenge);
    }

    private async Task<bool> TryClaimAsync(int challengeId, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var affected = await dbContext.AccountSecurityChallenges
            .Where(challenge => challenge.Id == challengeId
                && challenge.UsedAt == null
                && challenge.ExpiresAt > now)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(challenge => challenge.UsedAt, now),
                cancellationToken);
        return affected == 1;
    }

    private async Task ApplyPasswordHashAsync(
        User user,
        string passwordHash,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        await InvalidateSecurityStateAsync(user.Id, now, revokeSessions: true, cancellationToken);
        user.PasswordHash = passwordHash;
        user.UpdatedAt = now;
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task InvalidateSecurityStateAsync(
        int userId,
        DateTimeOffset now,
        bool revokeSessions,
        CancellationToken cancellationToken)
    {
        await InvalidateAccountChallengesAsync(userId, now, cancellationToken);
        await dbContext.PasswordRecoveryCodes
            .Where(current => current.UserId == userId && current.UsedAt == null)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(current => current.UsedAt, now),
                cancellationToken);

        if (revokeSessions)
        {
            await dbContext.UserSessions
                .Where(current => current.UserId == userId)
                .ExecuteDeleteAsync(cancellationToken);
        }
    }

    private async Task InvalidateAccountChallengesAsync(
        int userId,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        await dbContext.AccountSecurityChallenges
            .Where(current => current.UserId == userId && current.UsedAt == null)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(current => current.UsedAt, now),
                cancellationToken);
    }

    private async Task<AccountSecurityResult<ManagedTarget>> ResolveManagedTargetAsync(
        ClaimsPrincipal principal,
        string? identifier,
        CancellationToken cancellationToken)
    {
        var actor = await ResolveUserAsync(principal, cancellationToken);

        if (actor is null)
        {
            return Unauthorized<ManagedTarget>();
        }

        var target = await profileUsers.FindByIdentifierAsync(identifier, cancellationToken);

        if (target is null)
        {
            return AccountSecurityResult<ManagedTarget>.Failure(
                "Профиль не найден.",
                StatusCodes.Status404NotFound);
        }

        if (!CanManageSecurity(actor, target))
        {
            return AccountSecurityResult<ManagedTarget>.Failure(
                "Недостаточно прав для изменения безопасности этого аккаунта.",
                StatusCodes.Status403Forbidden);
        }

        return AccountSecurityResult<ManagedTarget>.Success(new ManagedTarget(actor, target));
    }

    private static bool CanManageSecurity(User actor, User target)
    {
        if (actor.Id == target.Id)
        {
            return false;
        }

        return actor.Role switch
        {
            UserRole.Admin => target.Role == UserRole.User,
            UserRole.Owner => target.Role is UserRole.User or UserRole.Admin,
            _ => false
        };
    }

    private async Task<User?> ResolveUserAsync(
        ClaimsPrincipal principal,
        CancellationToken cancellationToken)
    {
        var idValue = principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? principal.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (!int.TryParse(idValue, out var userId))
        {
            return null;
        }

        return await dbContext.Users.FirstOrDefaultAsync(
            user => user.Id == userId && !user.IsBlocked,
            cancellationToken);
    }

    private string HashCode(int userId, string purpose, string code)
    {
        var pepper = configuration["PasswordRecovery:CodePepper"];

        if (string.IsNullOrWhiteSpace(pepper) || Encoding.UTF8.GetByteCount(pepper) < 32)
        {
            throw new InvalidOperationException("PasswordRecovery:CodePepper должен быть не короче 32 байт.");
        }

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(pepper));
        return Convert.ToHexString(hmac.ComputeHash(
            Encoding.UTF8.GetBytes($"{userId}:{purpose}:{code}")));
    }

    private static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    private static bool HashesMatch(string expected, string actual) =>
        CryptographicOperations.FixedTimeEquals(
            Convert.FromHexString(expected),
            Convert.FromHexString(actual));

    private static string NormalizeEmail(string value) => value.Trim().ToLowerInvariant();

    private static string NormalizeLanguage(string? language) =>
        string.Equals(language, "en", StringComparison.OrdinalIgnoreCase)
            ? "en"
            : string.Equals(language, "uk", StringComparison.OrdinalIgnoreCase) ? "uk" : "ru";

    private static AccountSecurityResult<T> InvalidCode<T>() where T : class =>
        AccountSecurityResult<T>.Failure("Код неверный или уже истёк.");

    private static AccountSecurityResult<T> CodeAlreadySent<T>() where T : class =>
        AccountSecurityResult<T>.Failure(
            "Код уже отправлен. Подождите минуту перед повторным запросом.",
            StatusCodes.Status429TooManyRequests);

    private static AccountSecurityResult<T> Unauthorized<T>() where T : class =>
        AccountSecurityResult<T>.Failure(
            "Сессия истекла. Войдите снова.",
            StatusCodes.Status401Unauthorized);

    private static EmailEnvelope BuildCodeEmail(
        string? language,
        string recipient,
        string code,
        string purpose)
    {
        var normalizedLanguage = NormalizeLanguage(language);
        var action = purpose switch
        {
            LoginPurpose => normalizedLanguage == "uk" ? "входу в акаунт" : normalizedLanguage == "en" ? "signing in" : "входа в аккаунт",
            TogglePurpose => normalizedLanguage == "uk" ? "зміни двофакторного захисту" : normalizedLanguage == "en" ? "changing two-factor protection" : "изменения двухфакторной защиты",
            PasswordChangePurpose => normalizedLanguage == "uk" ? "зміни пароля" : normalizedLanguage == "en" ? "changing your password" : "изменения пароля",
            CurrentEmailPurpose => normalizedLanguage == "uk" ? "підтвердження поточної пошти" : normalizedLanguage == "en" ? "confirming your current email" : "подтверждения текущей почты",
            _ => normalizedLanguage == "uk" ? "підтвердження нової пошти" : normalizedLanguage == "en" ? "confirming your new email" : "подтверждения новой почты"
        };

        if (normalizedLanguage == "en")
        {
            return new EmailEnvelope(
                recipient,
                "FunPay security code",
                $"Your code for {action}: {code}\n\nIt is valid for {CodeLifetimeMinutes} minutes. Never share this code.",
                $"<p>Your code for {action}:</p><p style=\"font-size:28px;font-weight:700;letter-spacing:6px\">{code}</p><p>It is valid for {CodeLifetimeMinutes} minutes. Never share this code.</p>");
        }

        if (normalizedLanguage == "uk")
        {
            return new EmailEnvelope(
                recipient,
                "Код безпеки FunPay",
                $"Ваш код для {action}: {code}\n\nВін діє {CodeLifetimeMinutes} хвилин. Нікому не повідомляйте цей код.",
                $"<p>Ваш код для {action}:</p><p style=\"font-size:28px;font-weight:700;letter-spacing:6px\">{code}</p><p>Він діє {CodeLifetimeMinutes} хвилин. Нікому не повідомляйте цей код.</p>");
        }

        return new EmailEnvelope(
            recipient,
            "Код безопасности FunPay",
            $"Ваш код для {action}: {code}\n\nОн действует {CodeLifetimeMinutes} минут. Никому не сообщайте этот код.",
            $"<p>Ваш код для {action}:</p><p style=\"font-size:28px;font-weight:700;letter-spacing:6px\">{code}</p><p>Он действует {CodeLifetimeMinutes} минут. Никому не сообщайте этот код.</p>");
    }

    private static EmailEnvelope BuildEmailChangedNotice(string recipient)
    {
        const string text = "Почта аккаунта FunPay была изменена. Если это сделали не вы, немедленно восстановите доступ к аккаунту.";
        return new EmailEnvelope(
            recipient,
            "Почта аккаунта FunPay изменена",
            text,
            $"<p>{text}</p>");
    }

    private static EmailEnvelope BuildPasswordChangedNotice(string recipient)
    {
        const string text = "Пароль аккаунта FunPay был изменён. Если это сделали не вы, немедленно восстановите доступ к аккаунту.";
        return new EmailEnvelope(
            recipient,
            "Пароль аккаунта FunPay изменён",
            text,
            $"<p>{text}</p>");
    }

    private sealed record CreatedChallenge(SecurityChallengeResponse Response, string Code);

    private sealed record ManagedTarget(User Actor, User Target);
}
