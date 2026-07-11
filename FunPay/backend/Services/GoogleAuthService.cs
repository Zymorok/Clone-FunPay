using System.Security.Cryptography;
using FunPay.Backend.Data;
using FunPay.Backend.DTOs;
using FunPay.Backend.Models;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace FunPay.Backend.Services;

public sealed class GoogleAuthService(
    AppDbContext dbContext,
    AuthService authService,
    IPasswordHasher<User> passwordHasher,
    IConfiguration configuration)
{
    private const int NickGenerationAttempts = 32;

    public GoogleAuthConfigResponse GetPublicConfig()
    {
        var clientId = GetClientId();
        return new GoogleAuthConfigResponse
        {
            Enabled = !string.IsNullOrWhiteSpace(clientId),
            ClientId = clientId
        };
    }

    public async Task<AuthResult> AuthenticateAsync(
        GoogleAuthRequest request,
        CancellationToken cancellationToken)
    {
        var clientId = GetClientId();

        if (string.IsNullOrWhiteSpace(clientId))
        {
            return AuthResult.Failure(
                "Вход через Google пока не настроен.",
                StatusCodes.Status503ServiceUnavailable);
        }

        if (string.IsNullOrWhiteSpace(request.Credential))
        {
            return AuthResult.Failure("Google не передал данные для входа.");
        }

        GoogleJsonWebSignature.Payload profile;

        try
        {
            profile = await GoogleJsonWebSignature.ValidateAsync(
                request.Credential,
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = [clientId]
                });
        }
        catch (InvalidJwtException)
        {
            return AuthResult.Failure(
                "Не удалось подтвердить аккаунт Google. Попробуйте ещё раз.",
                StatusCodes.Status401Unauthorized);
        }

        if (!profile.EmailVerified
            || string.IsNullOrWhiteSpace(profile.Email)
            || string.IsNullOrWhiteSpace(profile.Subject))
        {
            return AuthResult.Failure(
                "Google-аккаунт должен иметь подтверждённую почту.",
                StatusCodes.Status401Unauthorized);
        }

        var email = profile.Email.Trim().ToLowerInvariant();
        var existingResult = await TrySignInExistingAsync(profile.Subject, email, cancellationToken);

        if (existingResult is not null)
        {
            return existingResult;
        }

        var baseNick = GoogleNickGenerator.CreateBase(profile.Name, email);

        for (var attempt = 0; attempt < NickGenerationAttempts; attempt += 1)
        {
            var nick = GoogleNickGenerator.CreateCandidate(baseNick, attempt);

            if (await dbContext.Users.AnyAsync(
                user => user.NormalizedNick == NickRules.Normalize(nick),
                cancellationToken))
            {
                continue;
            }

            var now = DateTimeOffset.UtcNow;
            var user = new User
            {
                PublicId = await GeneratePublicIdAsync(cancellationToken),
                Nick = nick,
                NormalizedNick = NickRules.Normalize(nick),
                Email = email,
                GoogleSubject = profile.Subject,
                Role = UserRole.User,
                CreatedAt = now,
                UpdatedAt = now
            };

            // Пароль для Google-аккаунта неизвестен даже серверу, но старый вход по паролю остаётся безопасным.
            user.PasswordHash = passwordHasher.HashPassword(
                user,
                Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)));
            dbContext.Users.Add(user);

            try
            {
                await dbContext.SaveChangesAsync(cancellationToken);
                return AuthResult.Success(await authService.IssueSessionForUserAsync(user, cancellationToken));
            }
            catch (DbUpdateException exception) when (IsUniqueConflict(exception))
            {
                // NOTE: Индексы базы остаются последней защитой, если два входа пришли одновременно.
                dbContext.ChangeTracker.Clear();
                var concurrentResult = await TrySignInExistingAsync(profile.Subject, email, cancellationToken);

                if (concurrentResult is not null)
                {
                    return concurrentResult;
                }
            }
        }

        return AuthResult.Failure(
            "Не удалось подобрать свободный ник. Попробуйте ещё раз.",
            StatusCodes.Status409Conflict);
    }

    private async Task<AuthResult?> TrySignInExistingAsync(
        string googleSubject,
        string email,
        CancellationToken cancellationToken)
    {
        var byGoogle = await dbContext.Users.FirstOrDefaultAsync(
            user => user.GoogleSubject == googleSubject,
            cancellationToken);

        if (byGoogle is not null)
        {
            return await CompleteSignInAsync(byGoogle, cancellationToken);
        }

        var byEmail = await dbContext.Users.FirstOrDefaultAsync(
            user => user.Email == email,
            cancellationToken);

        if (byEmail is null)
        {
            return null;
        }

        if (byEmail.IsBlocked)
        {
            return AuthResult.Failure("Аккаунт заблокирован.", StatusCodes.Status403Forbidden);
        }

        if (!string.IsNullOrWhiteSpace(byEmail.GoogleSubject)
            && !string.Equals(byEmail.GoogleSubject, googleSubject, StringComparison.Ordinal))
        {
            return AuthResult.Failure(
                "Эта почта уже связана с другим аккаунтом Google.",
                StatusCodes.Status409Conflict);
        }

        byEmail.GoogleSubject = googleSubject;
        byEmail.UpdatedAt = DateTimeOffset.UtcNow;

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (IsUniqueConflict(exception))
        {
            dbContext.ChangeTracker.Clear();
            var concurrentUser = await dbContext.Users.FirstOrDefaultAsync(
                user => user.GoogleSubject == googleSubject,
                cancellationToken);

            if (concurrentUser is null)
            {
                return AuthResult.Failure(
                    "Не удалось связать аккаунт Google. Попробуйте ещё раз.",
                    StatusCodes.Status409Conflict);
            }

            return await CompleteSignInAsync(concurrentUser, cancellationToken);
        }

        return await CompleteSignInAsync(byEmail, cancellationToken);
    }

    private async Task<AuthResult> CompleteSignInAsync(User user, CancellationToken cancellationToken)
    {
        if (user.IsBlocked)
        {
            return AuthResult.Failure("Аккаунт заблокирован.", StatusCodes.Status403Forbidden);
        }

        return AuthResult.Success(await authService.IssueSessionForUserAsync(user, cancellationToken));
    }

    private string GetClientId()
    {
        return configuration["Google:ClientId"]?.Trim() ?? string.Empty;
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
