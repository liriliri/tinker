@echo off
setlocal
set ELECTRON_RUN_AS_NODE=1
"%~dp0..\..\TINKER.exe" "%~dp0..\app.asar\main\cli.js" %*
IF %ERRORLEVEL% NEQ 0 EXIT /b %ERRORLEVEL%
endlocal
