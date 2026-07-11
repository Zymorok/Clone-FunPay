using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using FunPay.Backend.Data;
using FunPay.Backend.DTOs;
using FunPay.Backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Npgsql;

namespace FunPay.Backend.Services;

public class AuthService(
    AppDbContext dbContext,
    IPasswordHasher<User> passwordHasher,
    AccountSecurityService accountSecurityService,
    IConfiguration configuration)
{
    private static readonly EmailAddressAttribute EmailAddressValidator = new();
    private const int DefaultAccessTokenMinutes = 15;
    private const int DefaultRefreshTokenDays = 14;

    public async Task<RegisterResult> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        var nick = NickRules.PrepareForDisplay(request.Nick);
        var normalizedNick = NickRules.Normalize(nick);
        var email = Normalize(request.Email);

        if (request.Password != request.ConfirmPassword)
        {
            return RegisterResult.Failure("Пароли не совпадают.");
        }

        if (!NickRules.IsAllowed(nick))
        {
            return RegisterResult.Failure("Ник может содержать латинские буквы, цифры, точку, дефис и подчёркивание.");
        }

        if (await dbContext.Users.AnyAsync(user => user.NormalizedNick == normalizedNick, cancellationToken))
        {
            return RegisterResult.Failure("Такой ник уже занят.", StatusCodes.Status409Conflict);
        }

        if (await dbContext.Users.AnyAsync(user => user.Email == email, cancellationToken))
        {
            return RegisterResult.Failure("Такая почта уже занята.", StatusCodes.Status409Conflict);
        }

        var now = DateTimeOffset.UtcNow;
        var user = new User
        {
            PublicId = await GeneratePublicIdAsync(cancellationToken),
            Nick = nick,
            NormalizedNick = normalizedNick,
            Email = email,
            Role = UserRole.User,
            CreatedAt = now,
            UpdatedAt = now
        };

        // Пароль не сохраняем как текст: сохраняем только его безопасный отпечаток.
        user.PasswordHash = passwordHasher.HashPassword(user, request.Password);

        dbContext.Users.Add(user);

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (IsUniqueConflict(exception))
        {
            return RegisterResult.Failure("Ник или почта уже заняты.", StatusCodes.Status409Conflict);
        }

        return RegisterResult.Success(await IssueSessionAsync(user, cancellationToken));
    }

    public async Task<AuthResult> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        var identity = Normalize(request.Identity);
        var user = await dbContext.Users
            .FirstOrDefaultAsync(
                current => current.Email == identity || current.NormalizedNick == identity,
                cancellationToken);

        if (user is null)
        {
            return AuthResult.Failure("Неверный логин или пароль.", StatusCodes.Status401Unauthorized);
        }

        if (user.IsBlocked)
        {
            return AuthResult.Failure("Аккаунт заблокирован.", StatusCodes.Status403Forbidden);
        }

        var passwordStatus = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);

        if (passwordStatus == PasswordVerificationResult.Failed)
        {
            return AuthResult.Failure("Неверный логин или пароль.", StatusCodes.Status401Unauthorized);
        }

        if (passwordStatus == PasswordVerificationResult.SuccessRehashNeeded)
        {
            user.PasswordHash = passwordHasher.HashPassword(user, request.Password);
        }

        if (user.IsEmailTwoFactorEnabled)
        {
            var challenge = await accountSecurityService.StartLoginAsync(
                user,
                request.Language,
                cancellationToken);

            if (!challenge.IsSuccess || challenge.Value is null)
            {
                return AuthResult.Failure(challenge.Message, challenge.StatusCode);
            }

            return AuthResult.TwoFactorRequired(challenge.Value);
        }

        return AuthResult.Success(await IssueSessionAsync(user, cancellationToken));
    }

    public async Task<AuthResult> CompleteTwoFactorLoginAsync(
        VerifySecurityCodeRequest request,
        CancellationToken cancellationToken)
    {
        var verification = await accountSecurityService.CompleteLoginAsync(request, cancellationToken);

        if (!verification.IsSuccess || verification.Value is null)
        {
            return AuthResult.Failure(verification.Message, verification.StatusCode);
        }

        return AuthResult.Success(await IssueSessionAsync(verification.Value, cancellationToken));
    }

    public async Task<AuthResult> RefreshAsync(RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        var refreshToken = request.RefreshToken.Trim();

        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return AuthResult.Failure("Сессия истекла. Войдите снова.", StatusCodes.Status401Unauthorized);
        }

        var refreshTokenHash = HashRefreshToken(refreshToken);
        var now = DateTimeOffset.UtcNow;
        var session = await dbContext.UserSessions
            .Include(current => current.User)
            .FirstOrDefaultAsync(current => current.RefreshTokenHash == refreshTokenHash, cancellationToken);

        if (session is null || session.ExpiresAt <= now)
        {
            return AuthResult.Failure("Сессия истекла. Войдите снова.", StatusCodes.Status401Unauthorized);
        }

        var user = session.User;

        if (user.IsBlocked)
        {
            await ClearAllSessionsAsync(user, cancellationToken);
            return AuthResult.Failure("Аккаунт заблокирован.", StatusCodes.Status403Forbidden);
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        // NOTE: Забираем старую сессию одним запросом. Если параллельный refresh уже успел
        // удалить её, спокойно отклоняем повторный запрос вместо DbUpdateConcurrencyException.
        var claimedSessionCount = await dbContext.UserSessions
            .Where(current => current.Id == session.Id && current.RefreshTokenHash == refreshTokenHash)
            .ExecuteDeleteAsync(cancellationToken);

        if (claimedSessionCount == 0)
        {
            await transaction.RollbackAsync(cancellationToken);
            return AuthResult.Failure("Сессия истекла. Войдите снова.", StatusCodes.Status401Unauthorized);
        }

        dbContext.Entry(session).State = EntityState.Detached;
        var response = await IssueSessionAsync(user, cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return AuthResult.Success(response);
    }

    public async Task<RegisterResponse?> GetCurrentUserAsync(ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        var idValue = principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? principal.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (!int.TryParse(idValue, out var userId))
        {
            return null;
        }

        var user = await dbContext.Users.FirstOrDefaultAsync(current => current.Id == userId, cancellationToken);

        if (user is null || user.IsBlocked)
        {
            return null;
        }

        return MapUser(user);
    }

    public async Task LogoutAsync(LogoutRequest request, ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        UserSession? session = null;
        User? user = null;

        if (!string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            var refreshTokenHash = HashRefreshToken(request.RefreshToken.Trim());
            session = await dbContext.UserSessions
                .FirstOrDefaultAsync(current => current.RefreshTokenHash == refreshTokenHash, cancellationToken);
        }

        if (session is not null)
        {
            dbContext.UserSessions.Remove(session);
            await dbContext.SaveChangesAsync(cancellationToken);
            return;
        }

        if (user is null)
        {
            var idValue = principal.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? principal.FindFirstValue(JwtRegisteredClaimNames.Sub);

            if (int.TryParse(idValue, out var userId))
            {
                user = await dbContext.Users.FirstOrDefaultAsync(current => current.Id == userId, cancellationToken);
            }
        }

        if (user is not null)
        {
            await ClearAllSessionsAsync(user, cancellationToken);
        }
    }

    public async Task<AvailabilityResponse> CheckNickAvailabilityAsync(
        string? value,
        CancellationToken cancellationToken)
    {
        var nick = NickRules.PrepareForDisplay(value);
        var normalizedNick = NickRules.Normalize(nick);

        if (nick.Length < 3 || nick.Length > 32 || !NickRules.IsAllowed(nick))
        {
            return new AvailabilityResponse
            {
                Available = false,
                Message = "Ник пока не подходит."
            };
        }

        var isTaken = await dbContext.Users.AnyAsync(
            user => user.NormalizedNick == normalizedNick,
            cancellationToken);

        return new AvailabilityResponse
        {
            Available = !isTaken,
            Message = isTaken ? "Такой ник уже занят." : "Ник свободен."
        };
    }

    public async Task<AvailabilityResponse> CheckEmailAvailabilityAsync(
        string? value,
        CancellationToken cancellationToken)
    {
        var email = Normalize(value);

        if (email.Length > 254 || !EmailAddressValidator.IsValid(email))
        {
            return new AvailabilityResponse
            {
                Available = false,
                Message = "Почта пока не подходит."
            };
        }

        var isTaken = await dbContext.Users.AnyAsync(user => user.Email == email, cancellationToken);

        return new AvailabilityResponse
        {
            Available = !isTaken,
            Message = isTaken ? "Такая почта уже занята." : "Почта свободна."
        };
    }

    private async Task<AuthResponse> IssueSessionAsync(User user, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var accessTokenExpiresAt = now.AddMinutes(GetAccessTokenMinutes());
        var refreshToken = GenerateRefreshToken();

        user.LastLoginAt = now;
        user.UpdatedAt = now;
        dbContext.UserSessions.Add(new UserSession
        {
            UserId = user.Id,
            RefreshTokenHash = HashRefreshToken(refreshToken),
            ExpiresAt = now.AddDays(GetRefreshTokenDays()),
            CreatedAt = now,
            LastUsedAt = now
        });

        await dbContext.SaveChangesAsync(cancellationToken);

        return new AuthResponse
        {
            AccessToken = CreateAccessToken(user, accessTokenExpiresAt),
            RefreshToken = refreshToken,
            AccessTokenExpiresAt = accessTokenExpiresAt,
            User = MapUser(user)
        };
    }

    internal Task<AuthResponse> IssueSessionForUserAsync(User user, CancellationToken cancellationToken)
    {
        return IssueSessionAsync(user, cancellationToken);
    }

    private async Task ClearAllSessionsAsync(User user, CancellationToken cancellationToken)
    {
        dbContext.UserSessions.RemoveRange(dbContext.UserSessions.Where(session => session.UserId == user.Id));
        user.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private string CreateAccessToken(User user, DateTimeOffset expiresAt)
    {
        var issuer = configuration.GetValue("Jwt:Issuer", "FunPay.Backend");
        var audience = configuration.GetValue("Jwt:Audience", "FunPay.Frontend");
        var signingKey = configuration["Jwt:SigningKey"]
            ?? throw new InvalidOperationException("Не найден Jwt:SigningKey.");
        var keyBytes = Encoding.UTF8.GetBytes(signingKey);

        if (keyBytes.Length < 32)
        {
            throw new InvalidOperationException("Jwt:SigningKey должен быть не короче 32 байт.");
        }

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Nick),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(keyBytes),
            SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expiresAt.UtcDateTime,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private RegisterResponse MapUser(User user)
    {
        return new RegisterResponse
        {
            Id = user.Id,
            PublicId = user.PublicId,
            Nick = user.Nick,
            NormalizedNick = user.NormalizedNick,
            Email = user.Email,
            TwoFactorEnabled = user.IsEmailTwoFactorEnabled,
            Role = user.Role.ToString(),
            CanManageTeam = CanManageTeam(user),
            Gender = user.Gender ?? string.Empty,
            CreatedAt = user.CreatedAt,
            AvatarUrl = user.AvatarUrl ?? string.Empty,
            AvatarStyle = user.AvatarStyle,
            SelectedAvatarAsset = user.SelectedAvatarAsset ?? string.Empty,
            SelectedFrameAsset = user.SelectedFrameAsset ?? string.Empty,
            SelectedWallpaperAsset = user.SelectedWallpaperAsset ?? string.Empty
        };
    }

    private bool CanManageTeam(User user)
    {
        if (user.Role == UserRole.Owner)
        {
            return true;
        }

        return configuration
            .GetSection("TeamManagement:AllowedPublicIds")
            .Get<string[]>()
            ?.Contains(user.PublicId, StringComparer.Ordinal) == true;
    }

    private int GetAccessTokenMinutes()
    {
        return Math.Max(1, configuration.GetValue("Jwt:AccessTokenMinutes", DefaultAccessTokenMinutes));
    }

    private int GetRefreshTokenDays()
    {
        return Math.Max(1, configuration.GetValue("Jwt:RefreshTokenDays", DefaultRefreshTokenDays));
    }

    private static string GenerateRefreshToken()
    {
        return WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(64));
    }

    private static string HashRefreshToken(string refreshToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken));
        return Convert.ToHexString(bytes);
    }

    private static string Normalize(string? value)
    {
        return (value ?? string.Empty).Trim().ToLowerInvariant();
    }

    private async Task<string> GeneratePublicIdAsync(CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < 20; attempt += 1)
        {
            var publicId = RandomNumberGenerator.GetInt32(100_000_000, 1_000_000_000).ToString();

            if (!await dbContext.Users.AnyAsync(user => user.PublicId == publicId, cancellationToken))
            {
                return publicId;
            }
        }

        throw new InvalidOperationException("Не удалось сгенерировать уникальный ID аккаунта.");
    }

    private static bool IsUniqueConflict(DbUpdateException exception)
    {
        return exception.InnerException is PostgresException postgresException
            && postgresException.SqlState == PostgresErrorCodes.UniqueViolation;
    }
}
