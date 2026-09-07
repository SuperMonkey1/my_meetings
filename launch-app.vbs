Set FSO = CreateObject("Scripting.FileSystemObject")
ScriptDir = FSO.GetParentFolderName(WScript.ScriptFullName)
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = ScriptDir

WshShell.Run "cmd /c node """ & ScriptDir & "\node_modules\electron\cli.js"" .", 0, False
