$projectRoot = Split-Path -Parent $PSScriptRoot
$logPath = Join-Path $projectRoot "blog-automation.log"
$message = "Automatic blog publishing is paused. Create a draft manually with: node scripts/generate-blog-post.mjs"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Add-Content -Path $logPath -Value "[$timestamp] $message"
Write-Output $message
