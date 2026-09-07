@echo off
cd /d "%~dp0"
node "%~dp0node_modules\electron\cli.js" . > "%~dp0launch.log" 2> "%~dp0launch-err.log"
