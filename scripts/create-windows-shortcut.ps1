$projectDir = (Get-Item $PSScriptRoot).Parent.FullName
$vbsPath = Join-Path $projectDir "launch-app.vbs"
$icoPath = Join-Path $projectDir "static\app-icon.ico"

$wshShell = New-Object -ComObject WScript.Shell

# 1. Desktop "my apps" Folder Shortcut
$desktopDir = [Environment]::GetFolderPath('Desktop')
$myAppsDir = Join-Path $desktopDir "my apps"
if (-not (Test-Path $myAppsDir)) {
    New-Item -ItemType Directory -Force -Path $myAppsDir | Out-Null
}

$shortcutPath = Join-Path $myAppsDir "My Meetings.lnk"
$shortcut = $wshShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = "`"$vbsPath`""
$shortcut.WorkingDirectory = $projectDir
if (Test-Path $icoPath) {
    $shortcut.IconLocation = "$icoPath, 0"
}
$shortcut.Description = "My Meetings - AI Audio Transcription & Intelligence"
$shortcut.Save()
Write-Host "Created Desktop shortcut in: $shortcutPath"

# 2. Start Menu Shortcut
try {
    $startMenuDir = [Environment]::GetFolderPath('Programs')
    $startMenuShortcutPath = Join-Path $startMenuDir "My Meetings.lnk"
    $smShortcut = $wshShell.CreateShortcut($startMenuShortcutPath)
    $smShortcut.TargetPath = "wscript.exe"
    $smShortcut.Arguments = "`"$vbsPath`""
    $smShortcut.WorkingDirectory = $projectDir
    if (Test-Path $icoPath) {
        $smShortcut.IconLocation = "$icoPath, 0"
    }
    $smShortcut.Description = "My Meetings - AI Audio Transcription & Intelligence"
    $smShortcut.Save()
    Write-Host "Created Start Menu shortcut in: $startMenuShortcutPath"
} catch {}

Write-Host "Windows shortcuts configured successfully for My Meetings!"
