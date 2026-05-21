@echo off
setlocal
set ELECTRON_RUN_AS_NODE=1
"%~dp0..\node_modules\.bin\electron.cmd" "%~dp0..\dist\main\cli.js" %*
IF %ERRORLEVEL% NEQ 0 EXIT /b %ERRORLEVEL%
endlocal
