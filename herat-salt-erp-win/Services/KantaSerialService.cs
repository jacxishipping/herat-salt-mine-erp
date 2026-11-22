using System;
using System.IO.Ports;
using System.Text.RegularExpressions;

namespace HeratSaltErp.Services;

/// <summary>
/// Reads live weight frames from a physical RS-232 digital weighbridge (Kanta)
/// indicator on Windows COM ports (e.g., COM3, 9600 baud), with automatic
/// simulated fallback when testing without attached scale hardware.
/// </summary>
public sealed class KantaSerialService
{
    private static readonly Regex WeightPattern = new(@"([+-]?\d+(?:\.\d+)?)", RegexOptions.Compiled);

    public (double WeightKg, string Mode, string ScaleId) CaptureWeight(string comPort = "COM3")
    {
        try
        {
            using var port = new SerialPort(comPort, 9600, Parity.None, 8, StopBits.One)
            {
                ReadTimeout = 1500
            };
            port.Open();
            var line = port.ReadLine();
            var match = WeightPattern.Match(line);
            if (match.Success && double.TryParse(match.Groups[1].Value, out var parsed))
            {
                return (Math.Abs(Math.Round(parsed)), $"HARDWARE_{comPort}", "KANTA-GHR-01");
            }
        }
        catch
        {
            // Fallback to simulated RS-232 scale reading when COM hardware is absent
        }

        var simulated = 37600 + Random.Shared.Next(0, 1850);
        return (simulated, "SIMULATED_RS232", "KANTA-GHR-01");
    }
}
