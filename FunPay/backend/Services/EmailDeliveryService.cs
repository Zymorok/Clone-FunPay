using System.Threading.Channels;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace FunPay.Backend.Services;

public sealed record EmailEnvelope(string Recipient, string Subject, string Text, string Html);

public interface IEmailQueue
{
    bool TryQueue(EmailEnvelope message);
}

public sealed class EmailDeliveryService(
    IConfiguration configuration,
    ILogger<EmailDeliveryService> logger) : BackgroundService, IEmailQueue
{
    private readonly Channel<EmailEnvelope> queue = Channel.CreateBounded<EmailEnvelope>(
        new BoundedChannelOptions(100)
        {
            FullMode = BoundedChannelFullMode.DropOldest,
            SingleReader = true,
            SingleWriter = false
        });

    public bool TryQueue(EmailEnvelope message)
    {
        return queue.Writer.TryWrite(message);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var message in queue.Reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                await SendAsync(message, stoppingToken);
                logger.LogInformation("Письмо безопасности отправлено.");
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                // WARNING: Получателя не пишем в лог, чтобы не раскрывать почту пользователя.
                logger.LogError(exception, "Не удалось отправить письмо безопасности.");
            }
        }
    }

    private async Task SendAsync(EmailEnvelope envelope, CancellationToken cancellationToken)
    {
        var host = configuration["Smtp:Host"]?.Trim();
        var user = configuration["Smtp:User"]?.Trim();
        var password = configuration["Smtp:Password"];
        var from = configuration["Smtp:From"]?.Trim();
        var port = Math.Clamp(configuration.GetValue("Smtp:Port", 465), 1, 65_535);

        if (string.IsNullOrWhiteSpace(host)
            || string.IsNullOrWhiteSpace(user)
            || string.IsNullOrWhiteSpace(password))
        {
            throw new InvalidOperationException("SMTP не настроен.");
        }

        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(string.IsNullOrWhiteSpace(from) ? user : from));
        message.To.Add(MailboxAddress.Parse(envelope.Recipient));
        message.Subject = envelope.Subject;
        message.Body = new BodyBuilder
        {
            TextBody = envelope.Text,
            HtmlBody = envelope.Html
        }.ToMessageBody();

        using var client = new SmtpClient();
        var socketOptions = (configuration["Smtp:Security"]?.Trim().ToLowerInvariant()) switch
        {
            "none" => SecureSocketOptions.None,
            "ssl" => SecureSocketOptions.SslOnConnect,
            "starttls" => SecureSocketOptions.StartTls,
            _ => port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls
        };
        await client.ConnectAsync(host, port, socketOptions, cancellationToken);
        await client.AuthenticateAsync(user, password, cancellationToken);
        await client.SendAsync(message, cancellationToken, null);
        await client.DisconnectAsync(true, cancellationToken);
    }
}
