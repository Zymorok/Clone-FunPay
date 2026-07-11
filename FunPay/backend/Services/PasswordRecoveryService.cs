using System.Security.Cryptography;
using System.Text;
using FunPay.Backend.Data;
using FunPay.Backend.DTOs;
using FunPay.Backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.WebUtilities;

namespace FunPay.Backend.Services;

public sealed class PasswordRecoveryService(
    AppDbContext dbContext,
    AuthService authService,
    IPasswordHasher<User> passwordHasher,
    IEmailQueue emailQueue,
    IConfiguration configuration)
{
    public const string AcceptedMessage =
        "Если аккаунт существует, письмо с кодом уже отправлено. Код действует 15 минут.";

    private const int CodeLifetimeMinutes = 15;
    private const int TicketLifetimeMinutes = 10;
    private const int MaximumFailedAttempts = 5;
    private static readonly TimeSpan RequestCooldown = TimeSpan.FromMinutes(1);

    public async Task RequestCodeAsync(
        PasswordRecoveryRequest request,
        CancellationToken cancellationToken)
    {
        var identity = NormalizeIdentity(request.Identity);
        var now = DateTimeOffset.UtcNow;
        var user = await dbContext.Users.FirstOrDefaultAsync(
            current => current.Email == identity || current.NormalizedNick == identity,
            cancellationToken);

        if (user is null)
        {
            // NOTE: Выполняем ту же криптографическую работу, чтобы немного выровнять время ответа.
            _ = HashCode("000000");
            return;
        }

        var recentCodeExists = await dbContext.PasswordRecoveryCodes.AnyAsync(
            recovery => recovery.UserId == user.Id
                && recovery.UsedAt == null
                && recovery.CreatedAt > now.Subtract(RequestCooldown),
            cancellationToken);

        if (recentCodeExists)
        {
            return;
        }

        await dbContext.PasswordRecoveryCodes
            .Where(recovery => recovery.UserId == user.Id && recovery.UsedAt == null)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(recovery => recovery.UsedAt, now),
                cancellationToken);

        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        dbContext.PasswordRecoveryCodes.Add(new PasswordRecoveryCode
        {
            UserId = user.Id,
            CodeHash = HashCode(code),
            CreatedAt = now,
            ExpiresAt = now.AddMinutes(CodeLifetimeMinutes)
        });
        await dbContext.SaveChangesAsync(cancellationToken);

        var message = BuildCodeEmail(NormalizeLanguage(request.Language), user.Email, code);
        _ = emailQueue.TryQueue(message);
    }

    public async Task<PasswordRecoveryResult> VerifyCodeAsync(
        PasswordRecoveryCodeRequest request,
        CancellationToken cancellationToken)
    {
        var identity = NormalizeIdentity(request.Identity);
        var now = DateTimeOffset.UtcNow;
        var user = await dbContext.Users.FirstOrDefaultAsync(
            current => current.Email == identity || current.NormalizedNick == identity,
            cancellationToken);

        if (user is null)
        {
            _ = HashCode(request.Code);
            return InvalidCode();
        }

        var recovery = await dbContext.PasswordRecoveryCodes
            .Where(current => current.UserId == user.Id && current.UsedAt == null)
            .OrderByDescending(current => current.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (recovery is null
            || recovery.ExpiresAt <= now
            || recovery.FailedAttempts >= MaximumFailedAttempts)
        {
            return InvalidCode();
        }

        if (!HashesMatch(recovery.CodeHash, HashCode(request.Code)))
        {
            recovery.FailedAttempts += 1;

            if (recovery.FailedAttempts >= MaximumFailedAttempts)
            {
                recovery.UsedAt = now;
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            return InvalidCode();
        }

        if (user.IsBlocked)
        {
            return PasswordRecoveryResult.Failure(
                "Аккаунт заблокирован.",
                StatusCodes.Status403Forbidden);
        }

        var ticket = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(48));
        var ticketExpiresAt = now.AddMinutes(TicketLifetimeMinutes);
        recovery.VerifiedAt = now;
        recovery.TicketHash = HashTicket(ticket);
        recovery.TicketExpiresAt = ticketExpiresAt;
        await dbContext.SaveChangesAsync(cancellationToken);

        return PasswordRecoveryResult.Verified(ticket, ticketExpiresAt);
    }

    public async Task<PasswordRecoveryResult> LoginAsync(
        PasswordRecoveryTicketRequest request,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var recovery = await FindActiveTicketAsync(request.Ticket, cancellationToken);

        if (recovery is null)
        {
            return InvalidTicket();
        }

        if (recovery.User.IsBlocked)
        {
            return PasswordRecoveryResult.Failure(
                "Аккаунт заблокирован.",
                StatusCodes.Status403Forbidden);
        }

        if (!await TryClaimTicketAsync(recovery.Id, cancellationToken))
        {
            return InvalidTicket();
        }

        var session = await authService.IssueSessionForUserAsync(recovery.User, cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        _ = emailQueue.TryQueue(BuildSecurityNotice(recovery.User.Email, passwordChanged: false));

        return PasswordRecoveryResult.Authenticated(session);
    }

    public async Task<PasswordRecoveryResult> ResetPasswordAsync(
        PasswordRecoveryResetRequest request,
        CancellationToken cancellationToken)
    {
        if (request.Password != request.ConfirmPassword)
        {
            return PasswordRecoveryResult.Failure(
                "Пароли не совпадают.",
                StatusCodes.Status400BadRequest);
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var recovery = await FindActiveTicketAsync(request.Ticket, cancellationToken);

        if (recovery is null)
        {
            return InvalidTicket();
        }

        if (recovery.User.IsBlocked)
        {
            return PasswordRecoveryResult.Failure(
                "Аккаунт заблокирован.",
                StatusCodes.Status403Forbidden);
        }

        if (!await TryClaimTicketAsync(recovery.Id, cancellationToken))
        {
            return InvalidTicket();
        }

        await dbContext.UserSessions
            .Where(session => session.UserId == recovery.UserId)
            .ExecuteDeleteAsync(cancellationToken);
        recovery.User.PasswordHash = passwordHasher.HashPassword(recovery.User, request.Password);
        recovery.User.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);

        var session = await authService.IssueSessionForUserAsync(recovery.User, cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        _ = emailQueue.TryQueue(BuildSecurityNotice(recovery.User.Email, passwordChanged: true));

        return PasswordRecoveryResult.Authenticated(session);
    }

    private async Task<PasswordRecoveryCode?> FindActiveTicketAsync(
        string ticket,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(ticket))
        {
            return null;
        }

        var ticketHash = HashTicket(ticket.Trim());
        var now = DateTimeOffset.UtcNow;
        return await dbContext.PasswordRecoveryCodes
            .Include(recovery => recovery.User)
            .FirstOrDefaultAsync(
                recovery => recovery.TicketHash == ticketHash
                    && recovery.TicketExpiresAt > now
                    && recovery.UsedAt == null,
                cancellationToken);
    }

    private async Task<bool> TryClaimTicketAsync(int recoveryId, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var affected = await dbContext.PasswordRecoveryCodes
            .Where(recovery => recovery.Id == recoveryId && recovery.UsedAt == null)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(recovery => recovery.UsedAt, now),
                cancellationToken);
        return affected == 1;
    }

    private string HashCode(string code)
    {
        var pepper = configuration["PasswordRecovery:CodePepper"];

        if (string.IsNullOrWhiteSpace(pepper) || Encoding.UTF8.GetByteCount(pepper) < 32)
        {
            throw new InvalidOperationException("PasswordRecovery:CodePepper должен быть не короче 32 байт.");
        }

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(pepper));
        return Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(code)));
    }

    private static string HashTicket(string ticket)
    {
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(ticket)));
    }

    private static bool HashesMatch(string expected, string actual)
    {
        return CryptographicOperations.FixedTimeEquals(
            Convert.FromHexString(expected),
            Convert.FromHexString(actual));
    }

    private static string NormalizeIdentity(string? value)
    {
        return (value ?? string.Empty).Trim().ToLowerInvariant();
    }

    private static string NormalizeLanguage(string? value)
    {
        if (string.Equals(value, "en", StringComparison.OrdinalIgnoreCase))
        {
            return "en";
        }

        return string.Equals(value, "uk", StringComparison.OrdinalIgnoreCase) ? "uk" : "ru";
    }

    private static PasswordRecoveryResult InvalidCode()
    {
        return PasswordRecoveryResult.Failure("Код неверный или уже истёк.");
    }

    private static PasswordRecoveryResult InvalidTicket()
    {
        return PasswordRecoveryResult.Failure("Подтверждение истекло. Запросите новый код.");
    }

    private static EmailEnvelope BuildCodeEmail(string language, string email, string code)
    {
        if (language == "en")
        {
            return new EmailEnvelope(
                email,
                "FunPay sign-in code",
                $"Your code: {code}\n\nIt is valid for {CodeLifetimeMinutes} minutes. Never share this code. If you did not request it, simply ignore this email.",
                $"<p>Your FunPay sign-in or password reset code:</p><p style=\"font-size:28px;font-weight:700;letter-spacing:6px\">{code}</p><p>It is valid for {CodeLifetimeMinutes} minutes. Never share this code.</p><p>If you did not request it, simply ignore this email.</p>");
        }

        if (language == "uk")
        {
            return new EmailEnvelope(
                email,
                "Код входу FunPay",
                $"Ваш код: {code}\n\nВін діє {CodeLifetimeMinutes} хвилин. Нікому не повідомляйте цей код. Якщо ви його не запитували, просто проігноруйте лист.",
                $"<p>Ваш код для входу або зміни пароля FunPay:</p><p style=\"font-size:28px;font-weight:700;letter-spacing:6px\">{code}</p><p>Він діє {CodeLifetimeMinutes} хвилин. Нікому не повідомляйте цей код.</p><p>Якщо ви його не запитували, просто проігноруйте лист.</p>");
        }

        return new EmailEnvelope(
            email,
            "Код входа FunPay",
            $"Ваш код: {code}\n\nОн действует {CodeLifetimeMinutes} минут. Никому не сообщайте этот код. Если вы его не запрашивали, просто проигнорируйте письмо.",
            $"<p>Ваш код для входа или смены пароля FunPay:</p><p style=\"font-size:28px;font-weight:700;letter-spacing:6px\">{code}</p><p>Он действует {CodeLifetimeMinutes} минут. Никому не сообщайте этот код.</p><p>Если вы его не запрашивали, просто проигнорируйте письмо.</p>");
    }

    private static EmailEnvelope BuildSecurityNotice(string email, bool passwordChanged)
    {
        var action = passwordChanged ? "пароль был изменён" : "выполнен вход по одноразовому коду";
        var text = $"Для вашего аккаунта FunPay {action}. Если это были не вы, срочно запросите новый код и смените пароль.";
        return new EmailEnvelope(
            email,
            "Уведомление безопасности FunPay",
            text,
            $"<p>{text}</p>");
    }
}
