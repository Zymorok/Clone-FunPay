using System.ComponentModel;
using System.Diagnostics;
using System.Runtime.InteropServices;
using FunPay.Backend.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql;
using Serilog;

namespace FunPay.Backend.Development;

public static class DevDatabaseBootstrapper
{
    private const string ComposeFileName = "docker-compose.yml";
    private const string DefaultComposeService = "postgres";
    private static readonly TimeSpan CommandTimeout = TimeSpan.FromSeconds(45);
    private static readonly TimeSpan DockerProbeTimeout = TimeSpan.FromSeconds(8);

    public static async Task EnsureReadyAsync(
        IServiceProvider services,
        IConfiguration configuration,
        string contentRoot,
        CancellationToken cancellationToken)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Не найдена строка подключения к базе данных.");

        Notify("Проверяю подключение к PostgreSQL.");

        if (!await CanConnectAsync(connectionString, cancellationToken))
        {
            var projectRoot = FindProjectRoot(contentRoot)
                ?? throw new InvalidOperationException(
                    $"Не найден {ComposeFileName}. Клонируй проект полностью и запускай backend из решения FunPay.sln.");

            await EnsureDockerEngineAsync(configuration, cancellationToken);
            await StartPostgresAsync(projectRoot, configuration, cancellationToken);
            await WaitForDatabaseAsync(connectionString, configuration, cancellationToken);
        }

        await ApplyMigrationsAsync(services, cancellationToken);
    }

    private static async Task<bool> CanConnectAsync(
        string connectionString,
        CancellationToken cancellationToken)
    {
        try
        {
            var probeConnectionString = new NpgsqlConnectionStringBuilder(connectionString)
            {
                Timeout = 2
            };

            await using var connection = new NpgsqlConnection(probeConnectionString.ConnectionString);
            await connection.OpenAsync(cancellationToken);
            return true;
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception exception)
        {
            Log.Debug(exception, "PostgreSQL пока недоступен.");
            return false;
        }
    }

    private static async Task EnsureDockerEngineAsync(
        IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        if (await IsDockerEngineReadyAsync(cancellationToken))
        {
            Notify("Docker уже запущен.");
            return;
        }

        if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            throw new InvalidOperationException(
                "Docker не запущен. Запусти Docker Engine и повтори запуск проекта.");
        }

        var dockerDesktopPath = FindDockerDesktopPath()
            ?? throw new InvalidOperationException(
                "Docker Desktop не найден. Установи Docker Desktop один раз, после этого проект будет запускать его автоматически.");

        Notify("Docker Desktop выключен. Запускаю автоматически.");

        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = dockerDesktopPath,
                UseShellExecute = true
            });
        }
        catch (Exception exception)
        {
            throw new InvalidOperationException(
                $"Не удалось запустить Docker Desktop: {dockerDesktopPath}",
                exception);
        }

        var waitSeconds = Math.Max(
            20,
            configuration.GetValue("DevDatabase:DockerWaitSeconds", 120));
        var deadline = DateTimeOffset.UtcNow.AddSeconds(waitSeconds);

        while (DateTimeOffset.UtcNow < deadline)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (await IsDockerEngineReadyAsync(cancellationToken))
            {
                Notify("Docker Desktop готов.");
                return;
            }

            await Task.Delay(TimeSpan.FromSeconds(2), cancellationToken);
        }

        throw new InvalidOperationException(
            $"Docker Desktop не успел запуститься за {waitSeconds} секунд. Открой Docker Desktop и посмотри сообщение на его главном экране.");
    }

    private static async Task<bool> IsDockerEngineReadyAsync(CancellationToken cancellationToken)
    {
        var result = await RunDockerAsync(
            Environment.CurrentDirectory,
            ["info", "--format", "{{.ServerVersion}}"],
            DockerProbeTimeout,
            cancellationToken);

        return result.ExitCode == 0;
    }

    private static async Task StartPostgresAsync(
        string projectRoot,
        IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        var composeService = configuration.GetValue(
            "DevDatabase:ComposeService",
            DefaultComposeService);

        Notify($"Запускаю контейнер базы данных: {composeService}.");

        var result = await RunDockerAsync(
            projectRoot,
            ["compose", "--file", ComposeFileName, "up", "-d", composeService],
            CommandTimeout,
            cancellationToken);

        if (result.ExitCode != 0)
        {
            throw new InvalidOperationException(
                $"Не удалось запустить PostgreSQL через Docker Compose. {GetUsefulError(result)}");
        }

        Notify("Контейнер PostgreSQL запущен. Жду готовности базы.");
    }

    private static async Task WaitForDatabaseAsync(
        string connectionString,
        IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        var waitSeconds = Math.Max(
            10,
            configuration.GetValue("DevDatabase:DatabaseWaitSeconds", 60));
        var deadline = DateTimeOffset.UtcNow.AddSeconds(waitSeconds);

        while (DateTimeOffset.UtcNow < deadline)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (await CanConnectAsync(connectionString, cancellationToken))
            {
                Notify("PostgreSQL принимает подключения.");
                return;
            }

            await Task.Delay(TimeSpan.FromSeconds(2), cancellationToken);
        }

        throw new InvalidOperationException(
            $"PostgreSQL не ответил за {waitSeconds} секунд. Проверь состояние контейнера funpay-postgres в Docker Desktop.");
    }

    private static async Task ApplyMigrationsAsync(
        IServiceProvider services,
        CancellationToken cancellationToken)
    {
        await using var scope = services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var historyRepository = dbContext.GetService<IHistoryRepository>();

        await historyRepository.CreateIfNotExistsAsync(cancellationToken);

        var pendingMigrations = (await dbContext.Database
                .GetPendingMigrationsAsync(cancellationToken))
            .ToArray();

        if (pendingMigrations.Length == 0)
        {
            Notify("База данных готова, новых миграций нет.");
            return;
        }

        Notify($"Применяю миграции базы данных: {pendingMigrations.Length}.");
        await dbContext.Database.MigrateAsync(cancellationToken);
        Notify("Миграции применены. База данных готова.");
    }

    private static string? FindProjectRoot(string contentRoot)
    {
        var startDirectories = new[]
            {
                contentRoot,
                AppContext.BaseDirectory,
                Environment.CurrentDirectory
            }
            .Where(path => !string.IsNullOrWhiteSpace(path))
            .Select(Path.GetFullPath)
            .Distinct(StringComparer.OrdinalIgnoreCase);

        foreach (var startDirectory in startDirectories)
        {
            var current = new DirectoryInfo(startDirectory);

            while (current is not null)
            {
                if (File.Exists(Path.Combine(current.FullName, ComposeFileName)))
                {
                    return current.FullName;
                }

                current = current.Parent;
            }
        }

        return null;
    }

    private static string GetDockerExecutable()
    {
        if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            return "docker";
        }

        var installedDocker = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),
            "Docker",
            "Docker",
            "resources",
            "bin",
            "docker.exe");

        return File.Exists(installedDocker) ? installedDocker : "docker.exe";
    }

    private static string? FindDockerDesktopPath()
    {
        var programFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);

        var candidates = new[]
        {
            Path.Combine(programFiles, "Docker", "Docker", "Docker Desktop.exe"),
            Path.Combine(localAppData, "Docker", "Docker Desktop.exe"),
            Path.Combine(localAppData, "Programs", "Docker", "Docker", "Docker Desktop.exe")
        };

        return candidates.FirstOrDefault(File.Exists);
    }

    private static async Task<CommandResult> RunDockerAsync(
        string workingDirectory,
        IReadOnlyCollection<string> arguments,
        TimeSpan timeout,
        CancellationToken cancellationToken)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = GetDockerExecutable(),
            WorkingDirectory = Directory.Exists(workingDirectory)
                ? workingDirectory
                : Environment.CurrentDirectory,
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true
        };

        foreach (var argument in arguments)
        {
            startInfo.ArgumentList.Add(argument);
        }

        try
        {
            using var process = new Process { StartInfo = startInfo };

            if (!process.Start())
            {
                return new CommandResult(-1, string.Empty, "Не удалось создать процесс Docker.");
            }

            var outputTask = process.StandardOutput.ReadToEndAsync(cancellationToken);
            var errorTask = process.StandardError.ReadToEndAsync(cancellationToken);
            using var timeoutSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeoutSource.CancelAfter(timeout);

            try
            {
                await process.WaitForExitAsync(timeoutSource.Token);
            }
            catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
                TryKillProcess(process);
                return new CommandResult(-1, string.Empty, $"Команда Docker выполнялась дольше {timeout.TotalSeconds:0} секунд.");
            }
            catch (OperationCanceledException)
            {
                TryKillProcess(process);
                throw;
            }

            var output = await outputTask;
            var error = await errorTask;
            Log.Debug(
                "Docker завершил команду | code={ExitCode} | output={Output} | error={Error}",
                process.ExitCode,
                output.Trim(),
                error.Trim());
            return new CommandResult(process.ExitCode, output, error);
        }
        catch (Win32Exception exception)
        {
            Log.Debug(exception, "Docker CLI не найден.");
            return new CommandResult(-1, string.Empty, "Docker CLI не найден.");
        }
    }

    private static string GetUsefulError(CommandResult result)
    {
        var text = string.IsNullOrWhiteSpace(result.Error)
            ? result.Output
            : result.Error;
        var lastLine = text
            .Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .LastOrDefault();

        return string.IsNullOrWhiteSpace(lastLine)
            ? $"Код завершения: {result.ExitCode}."
            : lastLine;
    }

    private static void TryKillProcess(Process process)
    {
        try
        {
            if (!process.HasExited)
            {
                process.Kill(entireProcessTree: true);
            }
        }
        catch
        {
        }
    }

    private static void Notify(string message)
    {
        Log.Information("{Text:l}", message);
    }

    private sealed record CommandResult(int ExitCode, string Output, string Error);
}
