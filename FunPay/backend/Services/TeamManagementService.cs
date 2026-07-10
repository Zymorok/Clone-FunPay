using System.Security.Claims;
using FunPay.Backend.Data;
using FunPay.Backend.DTOs;
using FunPay.Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace FunPay.Backend.Services;

public class TeamManagementService(AppDbContext dbContext, IConfiguration configuration)
{
    private const int SearchLimit = 20;

    public async Task<TeamSearchResult> SearchAsync(
        ClaimsPrincipal principal,
        string? query,
        CancellationToken cancellationToken)
    {
        var actor = await FindActiveUserAsync(principal, cancellationToken);

        if (actor is null)
        {
            return TeamSearchResult.Failure("Сессия истекла. Войдите снова.", StatusCodes.Status401Unauthorized);
        }

        if (!CanManage(actor))
        {
            return TeamSearchResult.Failure("У вас нет доступа к управлению ролями.", StatusCodes.Status403Forbidden);
        }

        var search = (query ?? string.Empty).Trim();

        if (search.Length == 0)
        {
            return TeamSearchResult.Success([]);
        }

        if (search.Length > 64)
        {
            return TeamSearchResult.Failure("Поисковый запрос слишком длинный.", StatusCodes.Status400BadRequest);
        }

        // Ищем по видимому нику, без требования к нормализованному значению.
        var needle = search.ToLowerInvariant();
        var accounts = await dbContext.Users
            .AsNoTracking()
            .Where(user => !user.IsBlocked
                && (user.Nick.ToLower().Contains(needle)
                    || user.Email.ToLower().Contains(needle)
                    || user.PublicId.Contains(needle)))
            .OrderBy(user => user.Nick)
            .Take(SearchLimit)
            .Select(user => new TeamAccountResponse
            {
                Id = user.Id,
                PublicId = user.PublicId,
                Nick = user.Nick,
                Email = user.Email,
                Role = user.Role.ToString(),
                Gender = user.Gender ?? string.Empty
            })
            .ToListAsync(cancellationToken);

        return TeamSearchResult.Success(accounts);
    }

    public async Task<TeamRoleUpdateResult> UpdateRoleAsync(
        ClaimsPrincipal principal,
        int accountId,
        UpdateTeamRoleRequest request,
        CancellationToken cancellationToken)
    {
        var actor = await FindActiveUserAsync(principal, cancellationToken);

        if (actor is null)
        {
            return TeamRoleUpdateResult.Failure("Сессия истекла. Войдите снова.", StatusCodes.Status401Unauthorized);
        }

        if (!CanManage(actor))
        {
            return TeamRoleUpdateResult.Failure("У вас нет доступа к управлению ролями.", StatusCodes.Status403Forbidden);
        }

        if (!Enum.TryParse<UserRole>(request.Role, true, out var nextRole)
            || !Enum.IsDefined(nextRole))
        {
            return TeamRoleUpdateResult.Failure("Выберите корректную роль.", StatusCodes.Status400BadRequest);
        }

        var target = await dbContext.Users
            .FirstOrDefaultAsync(user => user.Id == accountId && !user.IsBlocked, cancellationToken);

        if (target is null)
        {
            return TeamRoleUpdateResult.Failure("Аккаунт не найден.", StatusCodes.Status404NotFound);
        }

        target.Role = nextRole;
        target.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);

        return TeamRoleUpdateResult.Success(Map(target));
    }

    private async Task<User?> FindActiveUserAsync(ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        var idValue = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(idValue, out var userId)
            ? await dbContext.Users.FirstOrDefaultAsync(user => user.Id == userId && !user.IsBlocked, cancellationToken)
            : null;
    }

    private bool CanManage(User user)
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

    private static TeamAccountResponse Map(User user) => new()
    {
        Id = user.Id,
        PublicId = user.PublicId,
        Nick = user.Nick,
        Email = user.Email,
        Role = user.Role.ToString(),
        Gender = user.Gender ?? string.Empty
    };
}

public record TeamSearchResult(bool IsSuccess, int StatusCode, string? Message, IReadOnlyList<TeamAccountResponse> Accounts)
{
    public static TeamSearchResult Success(IReadOnlyList<TeamAccountResponse> accounts) => new(true, StatusCodes.Status200OK, null, accounts);

    public static TeamSearchResult Failure(string message, int statusCode) => new(false, statusCode, message, []);
}

public record TeamRoleUpdateResult(bool IsSuccess, int StatusCode, string? Message, TeamAccountResponse? Account)
{
    public static TeamRoleUpdateResult Success(TeamAccountResponse account) => new(true, StatusCodes.Status200OK, null, account);

    public static TeamRoleUpdateResult Failure(string message, int statusCode) => new(false, statusCode, message, null);
}
