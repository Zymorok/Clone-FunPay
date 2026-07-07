using FunPay.Backend.Data;
using FunPay.Backend.Logging;
using FunPay.Backend.Models;
using FunPay.Backend.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
const string FrontendCorsPolicy = "Frontend";

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
    builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

    builder.Services.AddCors(options =>
    {
        options.AddPolicy(FrontendCorsPolicy, policy =>
        {
            policy
                .WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
    });

    builder.Services.AddControllers();

    var app = builder.Build();

    app.UseSerilogRequestLogging();
    app.UseCors(FrontendCorsPolicy);

    app.MapControllers();

    app.MapGet("/", () => "FunPay backend работает.");

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
