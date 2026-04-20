param(
  [string]$TaskName = "WebAccessibilityDailyBlogPost",
  [string]$StartTime = "09:00"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$runnerPath = Join-Path $PSScriptRoot "run-daily-blog-post.ps1"

if (-not (Test-Path -LiteralPath $runnerPath)) {
  throw "Runner script not found at $runnerPath"
}

$validTime = [DateTime]::MinValue
if (-not [DateTime]::TryParse($StartTime, [ref]$validTime)) {
  throw "StartTime must be a valid time like 09:00 or 21:30."
}

$powershellPath = (Get-Command powershell -ErrorAction Stop).Source
$action = New-ScheduledTaskAction -Execute $powershellPath -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$runnerPath`""
$trigger = New-ScheduledTaskTrigger -Daily -At $validTime
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null

Write-Host "Scheduled task '$TaskName' created."
Write-Host "Runs daily at $($validTime.ToString("HH:mm"))."
Write-Host "Project root: $projectRoot"
Write-Host "Runner: $runnerPath"
