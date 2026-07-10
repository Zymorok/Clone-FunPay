using System.Security.Claims;
using System.Text.RegularExpressions;
using FunPay.Backend.Data;
using FunPay.Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace FunPay.Backend.Services;

public class ProfileUserResolver(AppDbContext dbContext)
{
    private static readonly Regex PublicIdPattern = new("^[0-9]{9}$", RegexOptions.Compiled);

    public async Task<User?> FindCurrentAsync(ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        var idValue = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(idValue, out var userId)
            ? await dbContext.Users
                .Include(user => user.ProfileContacts)
                .FirstOrDefaultAsync(user => user.Id == userId && !user.IsBlocked, cancellationToken)
            : null;
    }

    public async Task<User?> FindByIdentifierAsync(string? identifier, CancellationToken cancellationToken)
    {
        var preparedIdentifier = ProfileValueRules.Normalize(identifier);

        if (string.IsNullOrEmpty(preparedIdentifier))
        {
            return null;
        }

        var users = dbContext.Users
            .Include(user => user.ProfileContacts)
            .Where(user => !user.IsBlocked);

        if (PublicIdPattern.IsMatch(preparedIdentifier))
        {
            var userByPublicId = await users.FirstOrDefaultAsync(
                user => user.PublicId == preparedIdentifier,
                cancellationToken);

            if (userByPublicId is not null)
            {
                return userByPublicId;
            }
        }

        var normalizedNick = NickRules.Normalize(preparedIdentifier);
        return string.IsNullOrEmpty(normalizedNick)
            ? null
            : await users.FirstOrDefaultAsync(
                user => user.NormalizedNick == normalizedNick,
                cancellationToken);
    }
}
