namespace FunPay.Backend.Logging;

public sealed class LoggingStorageOptions
{
    public string BaseDir { get; set; } = "storage/logs";

    public bool ConsoleEnabled { get; set; } = true;

    public bool FileEnabled { get; set; } = true;

    public string ConsoleLevel { get; set; } = "Information";

    public string FileLevel { get; set; } = "Debug";

    public int RetentionDays { get; set; } = 7;
}
