using System;
using System.Collections.Generic;
using System.IO.Ports;
using System.Linq;
using System.Text.RegularExpressions;

namespace HeratSaltErp.Services;

/// <summary>
/// Configurable native Windows COM-port RS-232 weighbridge (Kanta) reader
/// with automatic simulated fallback when scale hardware is not connected.
/// </summary>
public sealed class KantaSerialService
{
    private static readonly Regex WeightPattern = new(@"([+-]?\d+(?:\.\d+)?)", RegexOptions.Compiled);

    public IReadOnlyList<string> GetAvailablePorts()
    {
        try
        {
            var ports = SerialPort.GetPortNames();
            if (ports.Length > 0) return ports.OrderBy(p => p).ToArray();
        }
        catch { /* ignore on restricted systems */ }
        return new[] { "COM1", "COM2", "COM3", "COM4", "COM5", "COM6" };
    }

    public (double WeightKg, string Mode, string ScaleId) CaptureWeight(string comPort = "COM3", int baudRate = 9600)
    {
        try
        {
            using var port = new SerialPort(comPort, baudRate, Parity.None, 8, StopBits.One)
            {
                ReadTimeout = 1500
            };
            port.Open();
            var line = port.ReadLine();
            var match = WeightPattern.Match(line);
            if (match.Success && double.TryParse(match.Groups[1].Value, out var parsed))
            {
                return (Math.Abs(Math.Round(parsed)), $"HARDWARE_{comPort}_{baudRate}", "KANTA-GHR-01");
            }
        }
        catch
        {
            // Fallback to simulated RS-232 reading when physical Kanta is absent
        }

        var simulated = 37600 + Random.Shared.Next(0, 1850);
        return (simulated, $"SIMULATED_{comPort}_{baudRate}", "KANTA-GHR-01");
    }
}
