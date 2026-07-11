using System.ComponentModel.DataAnnotations;

namespace FunPay.Backend.DTOs;

public sealed class ChatParticipantResponse
{
    public int Id { get; set; }
    public string PublicId { get; set; } = string.Empty;
    public string Nick { get; set; } = string.Empty;
    public string NormalizedNick { get; set; } = string.Empty;
    public string AvatarUrl { get; set; } = string.Empty;
    public string SelectedAvatarAsset { get; set; } = string.Empty;
    public string SelectedFrameAsset { get; set; } = string.Empty;
    public string Presence { get; set; } = "offline";
}

public sealed class ChatOrderResponse
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Game { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
}

public sealed class ChatConversationResponse
{
    public int OrderId { get; set; }
    public required ChatParticipantResponse Participant { get; set; }
    public required ChatOrderResponse Order { get; set; }
    public string LastMessage { get; set; } = string.Empty;
    public DateTimeOffset? LastMessageAt { get; set; }
    public int UnreadCount { get; set; }
}

public sealed class ChatMessageResponse
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int SenderId { get; set; }
    public string Text { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? ReadAt { get; set; }
}

public sealed class ChatMessagesPageResponse
{
    public IReadOnlyList<ChatMessageResponse> Items { get; set; } = [];
    public int? NextBeforeId { get; set; }
    public bool HasMore { get; set; }
}

public sealed class SendChatMessageRequest
{
    [Required]
    [StringLength(3000, MinimumLength = 1)]
    public string Text { get; set; } = string.Empty;
}
