# Herat Salt Mine ERP — Ghoryan & Kuhsan Operations

Complete **Salt Mine Enterprise Resource Planning (ERP) & Operations Management System** tailored for commercial salt mining in **Herat, Afghanistan**, styled with the **AI Bridge UI SaaS Design System** (Dark/Light themes, EN/Dari/Pashto RTL/LTR, AFN/USD dual-currency, 6-role RBAC, offline-first sync, anti-fraud weighbridge).

## Repository Structure

| Folder | Stack | Purpose |
| :--- | :--- | :--- |
| `herat-salt-erp-win/` | **C# / WPF (.NET 8 Windows)** | Native Windows desktop app with COM-port RS-232 Kanta reader, DPAPI JWT vault, offline local persistence, 80mm thermal waybill printing, and one-click `run-windows.bat` / `build-exe.bat` |
| `herat-salt-erp/` | **Next.js 16 + TypeScript + PostgreSQL 16** | Full-stack PWA web app, 14 REST API routes, PostgreSQL ACID schema with anti-fraud triggers (`db/schema.sql`), multi-sheet Excel (`.xlsx`) audit export, and Docker Compose deployment |

## Quick Start — Windows Desktop App (C# WPF)
On Windows 10/11 (with [.NET 8 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/8.0)):

```powershell
git clone https://github.com/jacxishipping/herat-salt-mine-erp.git
cd herat-salt-mine-erp\herat-salt-erp-win
.\run-windows.bat
```

To build a standalone `dist\HeratSaltErp.exe`:

```powershell
.\build-exe.bat
```

## Quick Start — Web App + PostgreSQL (Docker)
```bash
cd herat-salt-erp
docker compose up --build
```
