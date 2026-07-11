using System.Security.Claims;
using FunPay.Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace FunPay.Backend.Hubs;

[Authorize]
public sealed class ChatHub(ChatService chatService) : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        var orderIds = await chatService.GetAccessibleOrderIdsAsync(userId, Context.ConnectionAborted);

        foreach (var orderId in orderIds)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, ChatService.GetGroupName(orderId));
        }

        await base.OnConnectedAsync();
    }

    public async Task JoinOrder(int orderId)
    {
        var accessibleOrderIds = await chatService.GetAccessibleOrderIdsAsync(GetUserId(), Context.ConnectionAborted);
        if (!accessibleOrderIds.Contains(orderId))
        {
            throw new HubException("Этот чат недоступен.");
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, ChatService.GetGroupName(orderId));
    }

    private int GetUserId()
    {
        var value = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(value, out var userId))
        {
            throw new HubException("Сессия недействительна.");
        }

        return userId;
    }
}
