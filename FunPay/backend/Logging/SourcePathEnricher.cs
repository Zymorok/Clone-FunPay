using System.Diagnostics;
using Serilog.Core;
using Serilog.Events;

namespace FunPay.Backend.Logging;

public sealed class SourcePathEnricher(string projectRoot) : ILogEventEnricher
{
    private readonly string _projectRoot = Path.GetFullPath(projectRoot);

    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
    {
        var sourceContext = GetSourceContext(logEvent);
        if (IsSystemSource(sourceContext))
        {
            logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("SourcePath", sourceContext));
            logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("SourceLine", 0));
            return;
        }

        var trace = new StackTrace(true);
        foreach (var frame in trace.GetFrames() ?? [])
        {
            var method = frame.GetMethod();
            var typeName = method?.DeclaringType?.FullName ?? string.Empty;
            if (ShouldSkip(typeName))
            {
                continue;
            }

            var fileName = frame.GetFileName();
            if (string.IsNullOrWhiteSpace(fileName))
            {
                continue;
            }

            logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("SourcePath", ToProjectPath(fileName)));
            logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("SourceLine", frame.GetFileLineNumber()));
            return;
        }

        logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("SourcePath", sourceContext));
        logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("SourceLine", 0));
    }

    private static bool ShouldSkip(string typeName)
    {
        return typeName.StartsWith("Serilog", StringComparison.Ordinal)
            || typeName.StartsWith("Microsoft.Extensions.Logging", StringComparison.Ordinal)
            || typeName.StartsWith("FunPay.Backend.Logging", StringComparison.Ordinal);
    }

    private string ToProjectPath(string fileName)
    {
        var fullPath = Path.GetFullPath(fileName);
        var relative = Path.GetRelativePath(_projectRoot, fullPath);
        return relative.StartsWith("..", StringComparison.Ordinal)
            ? fullPath.Replace('\\', '/')
            : relative.Replace('\\', '/');
    }

    private static string GetSourceContext(LogEvent logEvent)
    {
        if (logEvent.Properties.TryGetValue("SourceContext", out var sourceContext))
        {
            return sourceContext.ToString().Trim('"');
        }

        return "unknown";
    }

    private static bool IsSystemSource(string sourceContext)
    {
        return sourceContext.StartsWith("Microsoft.", StringComparison.Ordinal)
            || sourceContext.StartsWith("System.", StringComparison.Ordinal)
            || sourceContext.StartsWith("Serilog.", StringComparison.Ordinal);
    }
}
