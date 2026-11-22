@echo off
title Build HeratSaltErp.exe (Standalone Windows x64)
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o ./dist
echo.
echo Built standalone executable at: %cd%\dist\HeratSaltErp.exe
pause
