# Herat Salt Mine ERP — Windows Desktop App (C# / WPF .NET 8)

Native Windows C# WPF application styled with the **AI Bridge UI SaaS Design System** (`Dark` `#090B11` & `Light` `#F8FAFC` live themes), tailored for commercial salt mining operations in **Ghoryan & Kuhsan, Herat, Afghanistan**.

## Key Features
- **AI Bridge UI Theme Engine:** Live Light/Dark `ResourceDictionary` switching ([DarkTheme.xaml](Themes/DarkTheme.xaml), [LightTheme.xaml](Themes/LightTheme.xaml), [Controls.xaml](Styles/Controls.xaml)).
- **Multilingual & RTL/LTR Mirroring:** Instant switching between **English (LTR)**, **Dari (RTL)**, and **Pashto (RTL)** using native WPF `FlowDirection.RightToLeft`.
- **Native Windows RS-232 Weighbridge (Kanta) Integration:** [KantaSerialService.cs](Services/KantaSerialService.cs) reads live ASCII weight frames from `COM3` (`System.IO.Ports`) with automatic simulated fallback when testing without attached hardware.
- **Offline-First Storage & DPAPI Security:** Persists field tickets, extraction logs, and HSE reports atomically in `%LocalAppData%\HeratSaltErp\erp_offline_store.json`, seals JWT tokens with Windows **DPAPI** (`ProtectedData.Protect`), and reconciles queued records against `/api/v1/sync/batch`.
- **80mm Thermal Waybill Printing & CSV Audit Export:** Native WPF `PrintDialog` + `FlowDocument` 80mm thermal gate-pass printing with SHA-256 QR seal, plus one-click Desktop CSV export.

## Build & Run on Windows 10 / 11
Requires **.NET 8 SDK** (or Visual Studio 2022 with the *.NET desktop development* workload):

```powershell
cd herat-salt-erp-win
dotnet restore
dotnet run
```

To build a standalone single-file `.exe` for deployment to mine-site weighbridge PCs:

```powershell
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true
```
