using System.IO;
using System.Windows.Media.Imaging;
using QRCoder;

namespace HeratSaltErp.Services;

/// <summary>
/// Generates real scannable 2D QR code BitmapImages for WPF Waybill Drawers
/// and 80mm thermal gate-pass receipts using QRCoder (no GDI+ dependency).
/// </summary>
public static class QrCodeService
{
    public static BitmapImage GenerateQrBitmap(string payload, int pixelsPerModule = 6)
    {
        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode(payload, QRCodeGenerator.ECCLevel.M);
        var pngQr = new PngByteQRCode(data);
        byte[] bytes = pngQr.GetGraphic(pixelsPerModule);

        using var ms = new MemoryStream(bytes);
        var img = new BitmapImage();
        img.BeginInit();
        img.CacheOption = BitmapCacheOption.OnLoad;
        img.StreamSource = ms;
        img.EndInit();
        img.Freeze();
        return img;
    }
}
