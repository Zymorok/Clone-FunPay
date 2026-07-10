using System.Security.Claims;
using FunPay.Backend.Data;
using FunPay.Backend.DTOs;
using FunPay.Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace FunPay.Backend.Services;

public class PresenceService(AppDbContext dbContext)
{
    public static readonly TimeSpan OfflineAfter = TimeSpan.FromSeconds(60);
    public static readonly TimeSpan AfkAfter = TimeSpan.FromMinutes(5);

    public async Task<PresenceResponse?> HeartbeatAsync(
        ClaimsPrincipal principal,
        bool isActive,
        CancellationToken cancellationToken)
    {
        var idValue = principal.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(idValue, out var userId))
        {
            return null;
        }

        var user = await dbContext.Users.FirstOrDefaultAsync(
            candidate => candidate.Id == userId && !candidate.IsBlocked,
            cancellationToken);

        if (user is null)
        {
            return null;
        }

        var now = DateTimeOffset.UtcNow;
        user.LastSeenAt = now;

        if (isActive)
        {
            user.LastActiveAt = now;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return new PresenceResponse { Status = ResolveStatus(user, now) };
    }

    public async Task<PresenceResponse?> GetByNormalizedNickAsync(
        string? normalizedNick,
        CancellationToken cancellationToken)
    {
        var preparedNick = NickRules.Normalize(normalizedNick ?? string.Empty);

        if (string.IsNullOrEmpty(preparedNick))
        {
            return null;
        }

        var user = await dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(
                candidate => candidate.NormalizedNick == preparedNick && !candidate.IsBlocked,
                cancellationToken);

        return user is null
            ? null
            : new PresenceResponse { Status = ResolveStatus(user) };
    }

    public static string ResolveStatus(User user, DateTimeOffset? currentTime = null)
    {
        var now = currentTime ?? DateTimeOffset.UtcNow;

        if (!user.LastSeenAt.HasValue || now - user.LastSeenAt.Value > OfflineAfter)
        {
            return "offline";
        }

        if (!user.LastActiveAt.HasValue || now - user.LastActiveAt.Value > AfkAfter)
        {
            return "afk";
        }

        return "online";
    }
}
