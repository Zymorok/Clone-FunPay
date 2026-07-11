using FunPay.Backend.Data;
using System.Text;
using FunPay.Backend.Logging;
using FunPay.Backend.Development;
using FunPay.Backend.Models;
using FunPay.Backend.Services;
using FunPay.Backend.Hubs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using Serilog.Events;
using System.Security.Claims;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);
const string FrontendCorsPolicy = "Frontend";
var backendUrl = builder.Configuration.GetValue("Backend:Url", "http://localhost:5090");
var shouldAutoStartFrontend = builder.Configuration.GetValue("DevFrontend:AutoStart", true);

Console.OutputEncoding = Encoding.UTF8;
builder.WebHost.UseUrls(backendUrl);

var logLayout = LoggingBootstrap.Configure(builder.Configuration, builder.Environment.ContentRootPath, "backend");
builder.Host.UseSerilog();

try
{
    Log.Information(
        "Логирование инициализировано | runtime={Runtime} | base_dir={BaseDir} | day_dir={DayDir}",
        logLayout.RuntimeName,
        logLayout.BaseDir,
        logLayout.DayDir);

    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("Не найдена строка подключения к базе.");

    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(connectionString));

    builder.Services.AddScoped<AuthService>();
    builder.Services.AddScoped<GoogleAuthService>();
    builder.Services.AddScoped<PasswordRecoveryService>();
    builder.Services.AddScoped<AccountSecurityService>();
    builder.Services.AddScoped<ProfileUserResolver>();
    builder.Services.AddScoped<ProfileCosmeticsService>();
    builder.Services.AddScoped<ProfileMapper>();
    builder.Services.AddScoped<ProfileAvatarService>();
    builder.Services.AddScoped<ProfileService>();
    builder.Services.AddScoped<PresenceService>();
    builder.Services.AddScoped<TeamManagementService>();
    builder.Services.AddScoped<ChatService>();
    builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
    builder.Services.AddSingleton<EmailDeliveryService>();
    builder.Services.AddSingleton<IEmailQueue>(services => services.GetRequiredService<EmailDeliveryService>());
    builder.Services.AddHostedService(services => services.GetRequiredService<EmailDeliveryService>());

    var jwtSigningKey = builder.Configuration["Jwt:SigningKey"]
        ?? throw new InvalidOperationException("Не найден Jwt:SigningKey.");
    var jwtSigningKeyBytes = Encoding.UTF8.GetBytes(jwtSigningKey);

    if (jwtSigningKeyBytes.Length < 32)
    {
        throw new InvalidOperationException("Jwt:SigningKey должен быть не короче 32 байт.");
    }

    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = builder.Configuration.GetValue("Jwt:Issuer", "FunPay.Backend"),
                ValidateAudience = true,
                ValidAudience = builder.Configuration.GetValue("Jwt:Audience", "FunPay.Frontend"),
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(jwtSigningKeyBytes),
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromSeconds(30)
            };
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var accessToken = context.Request.Query["access_token"];
                    if (!string.IsNullOrWhiteSpace(accessToken)
                        && context.HttpContext.Request.Path.StartsWithSegments("/hubs/chat"))
                    {
                        context.Token = accessToken;
                    }

                    return Task.CompletedTask;
                }
            };
        });

    builder.Services.AddAuthorization();

    builder.Services.AddCors(options =>
    {
        options.AddPolicy(FrontendCorsPolicy, policy =>
        {
            policy
                .WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        });
    });

    builder.Services.AddSignalR(options =>
    {
        options.EnableDetailedErrors = false;
        options.MaximumReceiveMessageSize = 16 * 1024;
    });
    builder.Services.AddRateLimiter(options =>
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        options.AddPolicy("chat-send", httpContext =>
            RateLimitPartition.GetSlidingWindowLimiter(
                httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? httpContext.Connection.RemoteIpAddress?.ToString()
                    ?? "anonymous",
                _ => new SlidingWindowRateLimiterOptions
                {
                    PermitLimit = 30,
                    Window = TimeSpan.FromSeconds(10),
                    SegmentsPerWindow = 2,
                    QueueLimit = 0
                }));

        options.AddPolicy("password-recovery-request", httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
                $"password-recovery-request:{httpContext.Connection.RemoteIpAddress}",
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 5,
                    Window = TimeSpan.FromMinutes(15),
                    QueueLimit = 0,
                    AutoReplenishment = true
                }));

        options.AddPolicy("login-attempt", httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
                $"login-attempt:{httpContext.Connection.RemoteIpAddress}",
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 30,
                    Window = TimeSpan.FromMinutes(5),
                    QueueLimit = 0,
                    AutoReplenishment = true
                }));

        options.AddPolicy("password-recovery-verify", httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
                $"password-recovery-verify:{httpContext.Connection.RemoteIpAddress}",
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 20,
                    Window = TimeSpan.FromMinutes(15),
                    QueueLimit = 0,
                    AutoReplenishment = true
                }));

        options.AddPolicy("account-security-request", httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
                $"account-security-request:{httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? httpContext.Connection.RemoteIpAddress?.ToString()}",
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 10,
                    Window = TimeSpan.FromMinutes(15),
                    QueueLimit = 0,
                    AutoReplenishment = true
                }));

        options.AddPolicy("account-security-verify", httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
                $"account-security-verify:{httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? httpContext.Connection.RemoteIpAddress?.ToString()}",
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 25,
                    Window = TimeSpan.FromMinutes(15),
                    QueueLimit = 0,
                    AutoReplenishment = true
                }));
    });
    builder.Services.AddControllers();

    var app = builder.Build();

    if (app.Environment.IsDevelopment()
        && builder.Configuration.GetValue("DevDatabase:AutoPrepare", true))
    {
        await DevDatabaseBootstrapper.EnsureReadyAsync(
            app.Services,
            builder.Configuration,
            app.Environment.ContentRootPath,
            app.Lifetime.ApplicationStopping);
    }

    app.UseSerilogRequestLogging(options =>
    {
        options.GetLevel = (httpContext, _, exception) =>
        {
            if (httpContext.Request.Path.StartsWithSegments("/internal/dev/frontend-heartbeat"))
            {
                return LogEventLevel.Verbose;
            }

            if (exception is not null || httpContext.Response.StatusCode >= 500)
            {
                return LogEventLevel.Error;
            }

            return LogEventLevel.Information;
        };
    });
    app.UseCors(FrontendCorsPolicy);
    app.UseStaticFiles();
    app.UseAuthentication();
    app.UseAuthorization();
    app.UseRateLimiter();

    app.MapControllers();
    app.MapHub<ChatHub>("/hubs/chat");

    if (shouldAutoStartFrontend)
    {
        DevFrontendLauncher.MapRoutes(app);

        app.MapGet("/", () => Results.Redirect(DevFrontendLauncher.FrontendUrl));

        app.Lifetime.ApplicationStarted.Register(() =>
        {
            _ = Task.Run(() => DevFrontendLauncher.StartAsync(
                app.Environment.ContentRootPath,
                app.Lifetime.ApplicationStopping));
        });
    }
    else
    {
        app.MapGet("/", () => "FunPay backend работает.");
    }

    Log.Information("Backend готов к запуску.");

    app.Run();
}
catch (HostAbortedException)
{
    Log.Information("Backend остановлен инструментом миграций.");
}
catch (Exception exception)
{
    Log.Fatal(exception, "Backend остановился из-за ошибки.");
    throw;
}
finally
{
    Log.CloseAndFlush();
}
