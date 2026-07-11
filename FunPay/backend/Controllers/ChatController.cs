using System.Security.Claims;
using FunPay.Backend.DTOs;
using FunPay.Backend.Hubs;
using FunPay.Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.SignalR;

namespace FunPay.Backend.Controllers;

[ApiController]
[Authorize]
[Route("api/chat")]
public sealed class ChatController(ChatService chatService, IHubContext<ChatHub> hubContext) : ControllerBase
{
    [HttpGet("conversations")]
    public async Task<ActionResult<IReadOnlyList<ChatConversationResponse>>> GetConversations(
        CancellationToken cancellationToken)
    {
        return Ok(await chatService.GetConversationsAsync(GetUserId(), cancellationToken));
    }

    [HttpGet("orders/{orderId:int}/messages")]
    public async Task<ActionResult<ChatMessagesPageResponse>> GetMessages(
        int orderId,
        [FromQuery] int? beforeId,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        return await ExecuteAsync(() => chatService.GetMessagesAsync(
            GetUserId(), orderId, beforeId, pageSize, cancellationToken));
    }

    [HttpGet("orders/{orderId:int}/messages/date/{date}")]
    public async Task<ActionResult<ChatMessagesPageResponse>> GetMessagesAroundDate(
        int orderId,
        DateOnly date,
        [FromQuery] int utcOffsetMinutes = 0,
        CancellationToken cancellationToken = default)
    {
        return await ExecuteAsync(() => chatService.GetMessagesAroundDateAsync(
            GetUserId(), orderId, date, utcOffsetMinutes, cancellationToken));
    }

    [HttpPost("orders/{orderId:int}/messages")]
    [EnableRateLimiting("chat-send")]
    public async Task<ActionResult<ChatMessageResponse>> SendMessage(
        int orderId,
        SendChatMessageRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var message = await chatService.SendMessageAsync(GetUserId(), orderId, request.Text, cancellationToken);
            await hubContext.Clients
                .Group(ChatService.GetGroupName(orderId))
                .SendAsync("MessageCreated", message, cancellationToken);
            return Ok(message);
        }
        catch (ChatAccessException exception)
        {
            return NotFound(new { message = exception.Message });
        }
        catch (ChatValidationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPost("orders/{orderId:int}/read")]
    public async Task<IActionResult> MarkRead(int orderId, CancellationToken cancellationToken)
    {
        try
        {
            var readAt = await chatService.MarkReadAsync(GetUserId(), orderId, cancellationToken);
            if (readAt is not null)
            {
                await hubContext.Clients
                    .Group(ChatService.GetGroupName(orderId))
                    .SendAsync("MessagesRead", new { orderId, readerId = GetUserId(), readAt }, cancellationToken);
            }

            return NoContent();
        }
        catch (ChatAccessException exception)
        {
            return NotFound(new { message = exception.Message });
        }
    }

    private async Task<ActionResult<ChatMessagesPageResponse>> ExecuteAsync(
        Func<Task<ChatMessagesPageResponse>> action)
    {
        try
        {
            return Ok(await action());
        }
        catch (ChatAccessException exception)
        {
            return NotFound(new { message = exception.Message });
        }
    }

    private int GetUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(value, out var userId)
            ? userId
            : throw new UnauthorizedAccessException("Сессия недействительна.");
    }
}
