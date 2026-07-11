using FunPay.Backend.Data;
using FunPay.Backend.DTOs;
using FunPay.Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace FunPay.Backend.Services;

public sealed class ChatService(AppDbContext dbContext)
{
    private const int DefaultPageSize = 50;
    private const int MaxPageSize = 100;
    private const int MaxMessageLength = 3000;

    public async Task<IReadOnlyList<ChatConversationResponse>> GetConversationsAsync(
        int userId,
        CancellationToken cancellationToken)
    {
        await EnsureActiveUserAsync(userId, cancellationToken);

        var rows = await dbContext.Orders
            .AsNoTracking()
            .Where(order => order.BuyerId == userId || order.SellerId == userId)
            .Select(order => new
            {
                order.Id,
                order.CreatedAt,
                order.Status,
                ProductTitle = order.Product!.Title,
                GameName = order.Product.Game!.Name,
                order.Product.Price,
                Participant = order.BuyerId == userId ? order.Seller! : order.Buyer!,
                LastMessage = order.Messages
                    .OrderByDescending(message => message.Id)
                    .Select(message => new { message.Text, message.CreatedAt })
                    .FirstOrDefault(),
                UnreadCount = order.Messages.Count(message => message.SenderId != userId && message.ReadAt == null)
            })
            .ToListAsync(cancellationToken);

        return rows
            .Select(row =>
            {
                return new ChatConversationResponse
                {
                    OrderId = row.Id,
                    Participant = MapParticipant(row.Participant),
                    Order = new ChatOrderResponse
                    {
                        Id = row.Id,
                        Title = row.ProductTitle,
                        Game = row.GameName,
                        Price = row.Price,
                        Status = row.Status.ToString(),
                        CreatedAt = row.CreatedAt
                    },
                    LastMessage = row.LastMessage?.Text ?? string.Empty,
                    LastMessageAt = row.LastMessage?.CreatedAt ?? row.CreatedAt,
                    UnreadCount = row.UnreadCount
                };
            })
            .OrderByDescending(conversation => conversation.LastMessageAt)
            .ToList();
    }

    public async Task<ChatMessagesPageResponse> GetMessagesAsync(
        int userId,
        int orderId,
        int? beforeId,
        int pageSize,
        CancellationToken cancellationToken)
    {
        await EnsureOrderAccessAsync(userId, orderId, cancellationToken);
        var take = Math.Clamp(pageSize <= 0 ? DefaultPageSize : pageSize, 1, MaxPageSize);
        var query = dbContext.Messages
            .AsNoTracking()
            .Where(message => message.OrderId == orderId);

        if (beforeId is > 0)
        {
            query = query.Where(message => message.Id < beforeId.Value);
        }

        var descending = await query
            .OrderByDescending(message => message.Id)
            .Take(take + 1)
            .ToListAsync(cancellationToken);
        var hasMore = descending.Count > take;
        var items = descending.Take(take).Reverse().Select(MapMessage).ToList();

        return new ChatMessagesPageResponse
        {
            Items = items,
            HasMore = hasMore,
            NextBeforeId = hasMore ? items[0].Id : null
        };
    }

    public async Task<ChatMessagesPageResponse> GetMessagesAroundDateAsync(
        int userId,
        int orderId,
        DateOnly date,
        int utcOffsetMinutes,
        CancellationToken cancellationToken)
    {
        await EnsureOrderAccessAsync(userId, orderId, cancellationToken);
        var safeOffset = Math.Clamp(utcOffsetMinutes, -14 * 60, 14 * 60);
        var start = new DateTimeOffset(date.ToDateTime(TimeOnly.MinValue), TimeSpan.FromMinutes(safeOffset))
            .ToUniversalTime();
        var end = start.AddDays(1);
        var datedMessages = await dbContext.Messages
            .AsNoTracking()
            .Where(message => message.OrderId == orderId && message.CreatedAt >= start && message.CreatedAt < end)
            .OrderBy(message => message.Id)
            .Take(MaxPageSize)
            .ToListAsync(cancellationToken);

        if (datedMessages.Count == 0)
        {
            var nearest = await dbContext.Messages
                .AsNoTracking()
                .Where(message => message.OrderId == orderId && message.CreatedAt >= start)
                .OrderBy(message => message.Id)
                .Take(DefaultPageSize)
                .ToListAsync(cancellationToken);

            datedMessages = nearest.Count > 0
                ? nearest
                : await dbContext.Messages
                    .AsNoTracking()
                    .Where(message => message.OrderId == orderId && message.CreatedAt < start)
                    .OrderByDescending(message => message.Id)
                    .Take(DefaultPageSize)
                    .ToListAsync(cancellationToken);

            datedMessages = datedMessages.OrderBy(message => message.Id).ToList();
        }

        var firstId = datedMessages.FirstOrDefault()?.Id;
        var hasMore = firstId is not null && await dbContext.Messages
            .AsNoTracking()
            .AnyAsync(message => message.OrderId == orderId && message.Id < firstId, cancellationToken);

        return new ChatMessagesPageResponse
        {
            Items = datedMessages.Select(MapMessage).ToList(),
            HasMore = hasMore,
            NextBeforeId = hasMore ? firstId : null
        };
    }

    public async Task<ChatMessageResponse> SendMessageAsync(
        int userId,
        int orderId,
        string text,
        CancellationToken cancellationToken)
    {
        await EnsureOrderAccessAsync(userId, orderId, cancellationToken);
        var normalizedText = text.Trim();

        if (normalizedText.Length == 0)
        {
            throw new ChatValidationException("Сообщение не может быть пустым.");
        }

        if (normalizedText.Length > MaxMessageLength)
        {
            throw new ChatValidationException($"В одном сообщении можно отправить не больше {MaxMessageLength} символов.");
        }

        var message = new Message
        {
            OrderId = orderId,
            SenderId = userId,
            Text = normalizedText,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.Messages.Add(message);
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapMessage(message);
    }

    public async Task<DateTimeOffset?> MarkReadAsync(
        int userId,
        int orderId,
        CancellationToken cancellationToken)
    {
        await EnsureOrderAccessAsync(userId, orderId, cancellationToken);
        var readAt = DateTimeOffset.UtcNow;
        var updatedCount = await dbContext.Messages
            .Where(message => message.OrderId == orderId && message.SenderId != userId && message.ReadAt == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(message => message.ReadAt, readAt), cancellationToken);

        if (updatedCount == 0)
        {
            return null;
        }

        return readAt;
    }

    public async Task<IReadOnlyList<int>> GetAccessibleOrderIdsAsync(
        int userId,
        CancellationToken cancellationToken)
    {
        await EnsureActiveUserAsync(userId, cancellationToken);
        return await dbContext.Orders
            .AsNoTracking()
            .Where(order => order.BuyerId == userId || order.SellerId == userId)
            .Select(order => order.Id)
            .ToListAsync(cancellationToken);
    }

    public static string GetGroupName(int orderId) => $"chat-order:{orderId}";

    private async Task EnsureOrderAccessAsync(int userId, int orderId, CancellationToken cancellationToken)
    {
        var hasAccess = await dbContext.Orders
            .AsNoTracking()
            .AnyAsync(order =>
                order.Id == orderId
                && (order.BuyerId == userId || order.SellerId == userId)
                && !order.Buyer!.IsBlocked
                && !order.Seller!.IsBlocked,
                cancellationToken);

        if (!hasAccess)
        {
            throw new ChatAccessException();
        }
    }

    private async Task EnsureActiveUserAsync(int userId, CancellationToken cancellationToken)
    {
        var isActive = await dbContext.Users
            .AsNoTracking()
            .AnyAsync(user => user.Id == userId && !user.IsBlocked, cancellationToken);

        if (!isActive)
        {
            throw new ChatAccessException();
        }
    }

    private static ChatMessageResponse MapMessage(Message message) => new()
    {
        Id = message.Id,
        OrderId = message.OrderId,
        SenderId = message.SenderId,
        Text = message.Text,
        CreatedAt = message.CreatedAt,
        ReadAt = message.ReadAt
    };

    private static ChatParticipantResponse MapParticipant(User user) => new()
    {
        Id = user.Id,
        PublicId = user.PublicId,
        Nick = user.Nick,
        NormalizedNick = user.NormalizedNick,
        AvatarUrl = user.AvatarUrl ?? string.Empty,
        SelectedAvatarAsset = user.SelectedAvatarAsset ?? string.Empty,
        SelectedFrameAsset = user.SelectedFrameAsset ?? string.Empty,
        Presence = GetPresence(user)
    };

    private static string GetPresence(User user)
    {
        var now = DateTimeOffset.UtcNow;
        if (user.LastActiveAt >= now.AddMinutes(-2))
        {
            return "online";
        }

        if (user.LastSeenAt >= now.AddMinutes(-15))
        {
            return "afk";
        }

        return "offline";
    }
}
