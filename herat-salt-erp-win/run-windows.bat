@echo off
title Herat Salt Mine ERP — Windows Desktop Launcher
echo Checking .NET 8 SDK...
where dotnet >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] .NET 8 SDK is not installed.
    echo Download from: https://dotnet.microsoft.com/en-us/download/dotnet/8.0
    pause
    exit /b 1
)
echo Restoring packages and launching Herat Salt Mine ERP...
dotnet restore
dotnet run
pause
