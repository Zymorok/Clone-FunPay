using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;
using Serilog;

namespace FunPay.Backend.Development;

public static class DevFrontendLauncher
{
    public const string FrontendUrl = "http://localhost:5173/register";

    private const string FrontendBaseUrl = "http://localhost:5173";
    private static readonly Regex AnsiSequence = new(@"\x1B\[[0-?]*[ -/]*[@-~]", RegexOptions.Compiled);
    private static readonly TimeSpan FrontendWaitLimit = TimeSpan.FromSeconds(60);
    private static readonly TimeSpan ExistingTabWaitLimit = TimeSpan.FromSeconds(5);
    private static readonly TimeSpan HeartbeatFreshness = TimeSpan.FromSeconds(10);

    private static DateTimeOffset lastFrontendHeartbeat = DateTimeOffset.MinValue;
    private static int startupStarted;
    private static int frontendErrorNoticeShown;

    public static void MapRoutes(WebApplication app)
    {
        app.MapPost("/internal/dev/frontend-heartbeat", () =>
        {
            lastFrontendHeartbeat = DateTimeOffset.UtcNow;
            return Results.NoContent();
        });
    }

    public static async Task StartAsync(string backendRoot, CancellationToken cancellationToken)
    {
        if (Interlocked.Exchange(ref startupStarted, 1) == 1)
        {
            return;
        }

        try
        {
            Notify("Запускаю сайт.");

            var frontendReady = await EnsureFrontendServerAsync(backendRoot, cancellationToken);

            if (!frontendReady)
            {
                Notify("Сайт не открыт: frontend пока не готов.");
                return;
            }

            await WaitForExistingFrontendTabAsync(cancellationToken);

            if (HasRecentFrontendHeartbeat())
            {
                Notify("Вкладка сайта уже открыта. Новую вкладку не создаю.");
                NotifySiteLink();
                Log.Information("Вкладка сайта уже открыта. Новую вкладку не создаю.");
                return;
            }

            OpenFrontendInBrowser();
        }
        catch (OperationCanceledException)
        {
        }
        catch (Exception exception)
        {
            Notify("Не удалось запустить сайт. Проверь логи backend.");
            Log.Warning(exception, "Не удалось запустить сайт.");
        }
    }

    private static async Task<bool> EnsureFrontendServerAsync(string backendRoot, CancellationToken cancellationToken)
    {
        if (await IsFrontendReachableAsync(cancellationToken))
        {
            Notify($"Frontend уже запущен: {FrontendBaseUrl}");
            return true;
        }

        var frontendRoot = FindFrontendRoot(backendRoot);

        if (frontendRoot is null)
        {
            Notify("Папка frontend не найдена.");
            Log.Warning(
                "Папка frontend не найдена | content_root={ContentRoot} | app_base={AppBase} | current_dir={CurrentDir}",
                backendRoot,
                AppContext.BaseDirectory,
                Environment.CurrentDirectory);
            return false;
        }

        Notify($"Папка frontend найдена: {frontendRoot}");
        Log.Information("Папка frontend найдена: {FrontendRoot}", frontendRoot);

        var dependenciesReady = await EnsureFrontendDependenciesAsync(frontendRoot, cancellationToken);

        if (!dependenciesReady)
        {
            return false;
        }

        var frontendProcess = StartFrontendProcess(frontendRoot, cancellationToken);

        if (frontendProcess is null)
        {
            return false;
        }

        var deadline = DateTimeOffset.UtcNow + FrontendWaitLimit;

        while (DateTimeOffset.UtcNow < deadline && !cancellationToken.IsCancellationRequested)
        {
            if (await IsFrontendReachableAsync(cancellationToken))
            {
                Notify($"Frontend готов: {FrontendBaseUrl}");
                return true;
            }

            if (frontendProcess.HasExited)
            {
                Notify($"Frontend остановился с кодом {frontendProcess.ExitCode}.");
                Log.Warning(
                    "Frontend остановился до запуска сайта. Код: {ExitCode}",
                    frontendProcess.ExitCode);
                return false;
            }

            await Task.Delay(500, cancellationToken);
        }

        Notify($"Frontend не ответил по адресу {FrontendBaseUrl}.");
        Log.Warning("Frontend не ответил по адресу {FrontendBaseUrl}.", FrontendBaseUrl);
        return false;
    }

    private static string? FindFrontendRoot(string backendRoot)
    {
        var startDirs = new[]
            {
                backendRoot,
                AppContext.BaseDirectory,
                Environment.CurrentDirectory
            }
            .Where(path => !string.IsNullOrWhiteSpace(path))
            .Select(Path.GetFullPath)
            .Distinct(StringComparer.OrdinalIgnoreCase);

        foreach (var startDir in startDirs)
        {
            var current = new DirectoryInfo(startDir);

            while (current is not null)
            {
                var nestedFrontend = Path.Combine(current.FullName, "FunPay", "frontend");
                if (IsFrontendRoot(nestedFrontend))
                {
                    return nestedFrontend;
                }

                var siblingFrontend = Path.Combine(current.FullName, "frontend");
                if (IsFrontendRoot(siblingFrontend))
                {
                    return siblingFrontend;
                }

                current = current.Parent;
            }
        }

        return null;
    }

    private static bool IsFrontendRoot(string path)
    {
        return File.Exists(Path.Combine(path, "package.json"))
            && File.Exists(Path.Combine(path, "vite.config.ts"));
    }

    private static async Task<bool> EnsureFrontendDependenciesAsync(string frontendRoot, CancellationToken cancellationToken)
    {
        if (!ShouldInstallDependencies(frontendRoot))
        {
            return true;
        }

        Notify("Устанавливаю зависимости frontend.");
        Log.Information("Устанавливаю зависимости frontend.");

        var exitCode = await RunNpmCommandAsync(frontendRoot, new[] { "install" }, cancellationToken);

        if (exitCode == 0)
        {
            Notify("Зависимости frontend готовы.");
            Log.Information("Зависимости frontend готовы.");
            return true;
        }

        Notify($"npm install завершился с кодом {exitCode}.");
        Log.Warning("npm install завершился с кодом {ExitCode}.", exitCode);
        return false;
    }

    private static bool ShouldInstallDependencies(string frontendRoot)
    {
        var nodeModulesRoot = Path.Combine(frontendRoot, "node_modules");

        if (!Directory.Exists(nodeModulesRoot))
        {
            return true;
        }

        var nodeModulesLock = Path.Combine(nodeModulesRoot, ".package-lock.json");

        if (!File.Exists(nodeModulesLock))
        {
            return true;
        }

        var installedAt = File.GetLastWriteTimeUtc(nodeModulesLock);
        var manifestPaths = new[]
        {
            Path.Combine(frontendRoot, "package.json"),
            Path.Combine(frontendRoot, "package-lock.json")
        };

        return manifestPaths
            .Where(File.Exists)
            .Any(path => File.GetLastWriteTimeUtc(path) > installedAt);
    }

    private static async Task<int> RunNpmCommandAsync(
        string frontendRoot,
        IReadOnlyCollection<string> arguments,
        CancellationToken cancellationToken)
    {
        var startInfo = CreateNpmStartInfo(frontendRoot);

        foreach (var argument in arguments)
        {
            startInfo.ArgumentList.Add(argument);
        }

        using var process = Process.Start(startInfo);

        if (process is null)
        {
            return -1;
        }

        process.OutputDataReceived += (_, eventArgs) => LogFrontendLine(eventArgs.Data);
        process.ErrorDataReceived += (_, eventArgs) => LogFrontendLine(eventArgs.Data);
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();

        try
        {
            await process.WaitForExitAsync(cancellationToken);
        }
        catch (OperationCanceledException)
        {
            TryKillProcess(process);
            throw;
        }

        return process.ExitCode;
    }

    private static Process? StartFrontendProcess(string frontendRoot, CancellationToken cancellationToken)
    {
        try
        {
            var startInfo = CreateNpmStartInfo(frontendRoot);

            startInfo.ArgumentList.Add("run");
            startInfo.ArgumentList.Add("dev");
            startInfo.ArgumentList.Add("--");
            startInfo.ArgumentList.Add("--host");
            startInfo.ArgumentList.Add("localhost");
            startInfo.ArgumentList.Add("--clearScreen");
            startInfo.ArgumentList.Add("false");

            var process = Process.Start(startInfo);

            if (process is null)
            {
                Notify("Не удалось создать процесс frontend.");
                Log.Warning("Не удалось создать процесс frontend.");
                return null;
            }

            cancellationToken.Register(static state =>
            {
                if (state is Process runningProcess)
                {
                    TryKillProcess(runningProcess);
                }
            }, process);

            process.OutputDataReceived += (_, eventArgs) => LogFrontendLine(eventArgs.Data);
            process.ErrorDataReceived += (_, eventArgs) => LogFrontendLine(eventArgs.Data);
            process.BeginOutputReadLine();
            process.BeginErrorReadLine();

            Notify("Frontend запускается.");
            Log.Information("Frontend запускается.");
            return process;
        }
        catch (Exception exception)
        {
            Notify("Не удалось запустить frontend.");
            Log.Warning(exception, "Не удалось запустить frontend.");
            return null;
        }
    }

    private static ProcessStartInfo CreateNpmStartInfo(string frontendRoot)
    {
        return new ProcessStartInfo
        {
            FileName = GetNpmExecutable(),
            WorkingDirectory = frontendRoot,
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true
        };
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

    private static async Task WaitForExistingFrontendTabAsync(CancellationToken cancellationToken)
    {
        var deadline = DateTimeOffset.UtcNow + ExistingTabWaitLimit;

        while (DateTimeOffset.UtcNow < deadline && !cancellationToken.IsCancellationRequested)
        {
            if (HasRecentFrontendHeartbeat())
            {
                return;
            }

            await Task.Delay(400, cancellationToken);
        }
    }

    private static bool HasRecentFrontendHeartbeat()
    {
        return DateTimeOffset.UtcNow - lastFrontendHeartbeat <= HeartbeatFreshness;
    }

    private static async Task<bool> IsFrontendReachableAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var httpClient = new HttpClient
            {
                Timeout = TimeSpan.FromMilliseconds(800)
            };

            using var response = await httpClient.GetAsync(FrontendBaseUrl, cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    private static void OpenFrontendInBrowser()
    {
        var browserPath = FindPreferredBrowserPath();

        if (browserPath is not null)
        {
            try
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = browserPath,
                    UseShellExecute = true,
                    Arguments = $"--new-tab \"{FrontendUrl}\""
                });

                Notify($"Открываю сайт в браузере: {browserPath}");
                NotifySiteLink();
                Log.Information("Открываю сайт в браузере {BrowserPath}: {FrontendUrl}", browserPath, FrontendUrl);
                return;
            }
            catch (Exception exception)
            {
                Notify($"Не удалось открыть выбранный браузер: {browserPath}. Пробую браузер по умолчанию.");
                Log.Warning(exception, "Не удалось открыть выбранный браузер: {BrowserPath}.", browserPath);
            }
        }

        Process.Start(new ProcessStartInfo
        {
            FileName = FrontendUrl,
            UseShellExecute = true
        });

        Notify("Открываю сайт в браузере по умолчанию.");
        NotifySiteLink();
        Log.Information("Открываю сайт: {FrontendUrl}", FrontendUrl);
    }

    private static void Notify(string message)
    {
        Log.Information("{Text:l}", message);
    }

    private static void NotifySiteLink()
    {
        Notify($"Сайт запущен: {FrontendUrl}");
    }

    private static string GetNpmExecutable()
    {
        if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            return "npm";
        }

        var candidates = new[]
        {
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "nodejs", "npm.cmd"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "nodejs", "npm.cmd"),
            "npm.cmd"
        };

        return candidates.FirstOrDefault(File.Exists) ?? "npm.cmd";
    }

    private static string? FindPreferredBrowserPath()
    {
        var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        var programFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        var programFilesX86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);

        var candidates = new[]
        {
            Path.Combine(localAppData, "Vivaldi", "Application", "vivaldi.exe"),
            Path.Combine(programFiles, "Vivaldi", "Application", "vivaldi.exe"),
            Path.Combine(programFilesX86, "Vivaldi", "Application", "vivaldi.exe"),
            Path.Combine(localAppData, "Google", "Chrome", "Application", "chrome.exe"),
            Path.Combine(programFiles, "Google", "Chrome", "Application", "chrome.exe"),
            Path.Combine(programFilesX86, "Google", "Chrome", "Application", "chrome.exe")
        };

        return candidates.FirstOrDefault(File.Exists);
    }

    private static void LogFrontendLine(string? line)
    {
        if (!string.IsNullOrWhiteSpace(line))
        {
            var cleanLine = CleanFrontendLine(line);

            if (string.IsNullOrWhiteSpace(cleanLine))
            {
                return;
            }

            Log.Debug("Frontend: {Line}", cleanLine);

            if (IsImportantFrontendLine(cleanLine))
            {
                if (Interlocked.Exchange(ref frontendErrorNoticeShown, 1) == 0)
                {
                    Notify("Frontend сообщил об ошибке. Подробности сохранены в debug-логах.");
                }
            }
        }
    }

    private static string CleanFrontendLine(string line)
    {
        var withoutAnsi = AnsiSequence.Replace(line, string.Empty);
        var chars = withoutAnsi
            .Where(ch => !char.IsControl(ch) || ch is '\t')
            .ToArray();

        return new string(chars).Trim();
    }

    private static bool IsImportantFrontendLine(string line)
    {
        var lowerLine = line.ToLowerInvariant();

        return lowerLine.Contains("error", StringComparison.Ordinal)
            || lowerLine.Contains("failed", StringComparison.Ordinal)
            || lowerLine.Contains("eaddrinuse", StringComparison.Ordinal)
            || lowerLine.Contains("not found", StringComparison.Ordinal)
            || lowerLine.Contains("missing script", StringComparison.Ordinal)
            || lowerLine.Contains("cannot", StringComparison.Ordinal);
    }
}
