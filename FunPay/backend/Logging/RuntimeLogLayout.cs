namespace FunPay.Backend.Logging;

public sealed class RuntimeLogLayout
{
    public required string RuntimeName { get; init; }

    public required DateTimeOffset StartedAt { get; init; }

    public required string BaseDir { get; init; }

    public required string DayDir { get; init; }

    public required IReadOnlyDictionary<string, string> Files { get; init; }

    public required string InternalFile { get; init; }
}
