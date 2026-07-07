using System.Globalization;
using System.Text;
using Microsoft.Extensions.Configuration;
using Serilog;
using Serilog.Debugging;
using Serilog.Events;

namespace FunPay.Backend.Logging;

public static class LoggingBootstrap
{
    private static readonly IReadOnlyList<(string Folder, LogEventLevel Level)> LevelFiles =
    [
        ("debug", LogEventLevel.Debug),
        ("info", LogEventLevel.Information),
        ("warning", LogEventLevel.Warning),
        ("error", LogEventLevel.Error),
        ("critical", LogEventLevel.Fatal)
    ];

    private const string FileTemplate =
        "[{Timestamp:yyyy-MM-dd HH:mm:ss.fff}] | {Level:u11} | {SourcePath}:{SourceLine} | {Message:lj}{NewLine}{Exception}";

    private const string ConsoleTemplate =
        "{Timestamp:HH:mm:ss} | {Level:u3} | {Message:lj}{NewLine}{Exception}";

    public static RuntimeLogLayout Configure(IConfiguration configuration, string contentRootPath, string runtimeName)
    {
        var options = ReadOptions(configuration);
        var projectRoot = FindProjectRoot(contentRootPath);
        var layout = BuildLayout(projectRoot, options.BaseDir, runtimeName);

        if (options.FileEnabled)
        {
            CleanupOldDays(layout.BaseDir, options.RetentionDays, layout.StartedAt.Date);
            EnsureFiles(layout);
            SelfLog.Enable(message => File.AppendAllText(layout.InternalFile, message + Environment.NewLine, Encoding.UTF8));
        }

        var loggerConfiguration = new LoggerConfiguration()
            .MinimumLevel.Verbose()
            .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
            .MinimumLevel.Override("System", LogEventLevel.Warning)
            .Enrich.FromLogContext()
            .Enrich.With(new SourcePathEnricher(projectRoot));

        if (options.ConsoleEnabled)
        {
            loggerConfiguration.WriteTo.Console(
                restrictedToMinimumLevel: ParseLevel(options.ConsoleLevel, LogEventLevel.Information),
                outputTemplate: ConsoleTemplate);
        }

        if (options.FileEnabled)
        {
            AddFileLoggers(loggerConfiguration, layout, ParseLevel(options.FileLevel, LogEventLevel.Debug));
        }

        Log.Logger = loggerConfiguration.CreateLogger();
        return layout;
    }

    private static LoggingStorageOptions ReadOptions(IConfiguration configuration)
    {
        var section = configuration.GetSection("LoggingStorage");
        var options = new LoggingStorageOptions();

        options.BaseDir = ReadString(section, "BaseDir", options.BaseDir);
        options.ConsoleLevel = ReadString(section, "ConsoleLevel", options.ConsoleLevel);
        options.FileLevel = ReadString(section, "FileLevel", options.FileLevel);
        options.ConsoleEnabled = ReadBool(section, "ConsoleEnabled", options.ConsoleEnabled);
        options.FileEnabled = ReadBool(section, "FileEnabled", options.FileEnabled);
        options.RetentionDays = Math.Max(1, ReadInt(section, "RetentionDays", options.RetentionDays));

        return options;
    }

    private static string ReadString(IConfiguration section, string key, string fallback)
    {
        var value = section[key];
        return string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
    }

    private static bool ReadBool(IConfiguration section, string key, bool fallback)
    {
        return bool.TryParse(section[key], out var value) ? value : fallback;
    }

    private static int ReadInt(IConfiguration section, string key, int fallback)
    {
        return int.TryParse(section[key], NumberStyles.Integer, CultureInfo.InvariantCulture, out var value)
            ? value
            : fallback;
    }

    private static string FindProjectRoot(string startPath)
    {
        var current = new DirectoryInfo(Path.GetFullPath(startPath));
        while (current is not null)
        {
            if (File.Exists(Path.Combine(current.FullName, "FunPay.sln"))
                || File.Exists(Path.Combine(current.FullName, "docker-compose.yml")))
            {
                return current.FullName;
            }

            current = current.Parent;
        }

        return Path.GetFullPath(startPath);
    }

    private static RuntimeLogLayout BuildLayout(string projectRoot, string baseDir, string runtimeName)
    {
        var startedAt = DateTimeOffset.Now;
        var safeRuntime = SanitizeRuntimeName(runtimeName);
        var resolvedBaseDir = Path.IsPathRooted(baseDir)
            ? Path.GetFullPath(baseDir)
            : Path.GetFullPath(Path.Combine(projectRoot, baseDir));

        var dayFolder = startedAt.ToString("dd.MM.yyyy", CultureInfo.InvariantCulture);
        var fileStamp = $"{startedAt:dd.MM}_time_{startedAt:HH.mm.ss}";
        var dayDir = Path.Combine(resolvedBaseDir, dayFolder);

        var files = new Dictionary<string, string>
        {
            ["all"] = BuildLogFile(dayDir, "all", fileStamp, safeRuntime)
        };

        foreach (var (folder, _) in LevelFiles)
        {
            files[folder] = BuildLogFile(dayDir, folder, fileStamp, safeRuntime);
        }

        return new RuntimeLogLayout
        {
            RuntimeName = safeRuntime,
            StartedAt = startedAt,
            BaseDir = resolvedBaseDir,
            DayDir = dayDir,
            Files = files,
            InternalFile = BuildLogFile(dayDir, "internal", fileStamp, safeRuntime)
        };
    }

    private static string BuildLogFile(string dayDir, string level, string fileStamp, string runtimeName)
    {
        return Path.Combine(dayDir, level, $"{level}_{fileStamp}_{runtimeName}.log");
    }

    private static string SanitizeRuntimeName(string runtimeName)
    {
        var chars = runtimeName.Select(ch => char.IsLetterOrDigit(ch) || ch is '-' or '_' ? ch : '_').ToArray();
        var cleaned = new string(chars).Trim('_');
        return string.IsNullOrWhiteSpace(cleaned) ? "runtime" : cleaned;
    }

    private static void CleanupOldDays(string baseDir, int retentionDays, DateTimeOffset today)
    {
        if (!Directory.Exists(baseDir))
        {
            return;
        }

        var cutoff = today.Date.AddDays(-(retentionDays - 1));
        foreach (var directory in Directory.EnumerateDirectories(baseDir))
        {
            var name = Path.GetFileName(directory);
            if (!DateTime.TryParseExact(name, "dd.MM.yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var day))
            {
                continue;
            }

            if (day.Date < cutoff)
            {
                Directory.Delete(directory, recursive: true);
            }
        }
    }

    private static void EnsureFiles(RuntimeLogLayout layout)
    {
        foreach (var path in layout.Files.Values.Append(layout.InternalFile))
        {
            Directory.CreateDirectory(Path.GetDirectoryName(path)!);
            if (!File.Exists(path))
            {
                File.WriteAllText(path, string.Empty, Encoding.UTF8);
            }
        }
    }

    private static void AddFileLoggers(LoggerConfiguration loggerConfiguration, RuntimeLogLayout layout, LogEventLevel fileLevel)
    {
        loggerConfiguration.WriteTo.File(
            layout.Files["all"],
            restrictedToMinimumLevel: fileLevel,
            outputTemplate: FileTemplate,
            encoding: Encoding.UTF8,
            shared: true);

        foreach (var (folder, level) in LevelFiles)
        {
            loggerConfiguration.WriteTo.Logger(child => child
                .Filter.ByIncludingOnly(logEvent => logEvent.Level == level && logEvent.Level >= fileLevel)
                .WriteTo.File(
                    layout.Files[folder],
                    restrictedToMinimumLevel: LogEventLevel.Verbose,
                    outputTemplate: FileTemplate,
                    encoding: Encoding.UTF8,
                    shared: true));
        }
    }

    private static LogEventLevel ParseLevel(string value, LogEventLevel fallback)
    {
        return value.Trim().ToUpperInvariant() switch
        {
            "TRACE" or "VERBOSE" => LogEventLevel.Verbose,
            "DEBUG" => LogEventLevel.Debug,
            "INFO" or "INFORMATION" => LogEventLevel.Information,
            "WARN" or "WARNING" => LogEventLevel.Warning,
            "ERROR" => LogEventLevel.Error,
            "CRITICAL" or "FATAL" => LogEventLevel.Fatal,
            _ => fallback
        };
    }
}
