$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$envFilePath = Join-Path $projectRoot ".env"
$logPath = Join-Path $projectRoot "blog-automation.log"

function Write-LogLine {
  param([string]$Message)

  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Add-Content -Path $logPath -Value "[$timestamp] $Message"
}

function Import-DotEnvFile {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    return
  }

  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()

    if (-not $line -or $line.StartsWith("#")) {
      return
    }

    $separatorIndex = $line.IndexOf("=")
    if ($separatorIndex -lt 1) {
      return
    }

    $name = $line.Substring(0, $separatorIndex).Trim()
    $value = $line.Substring($separatorIndex + 1).Trim().Trim("'`"")

    [Environment]::SetEnvironmentVariable($name, $value, "Process")
  }
}

try {
  Import-DotEnvFile -Path $envFilePath

  if (-not $env:OPENAI_API_KEY -or $env:OPENAI_API_KEY -eq "your_openai_api_key_here") {
    throw "OPENAI_API_KEY is missing. Add it to .env or your user environment variables."
  }

  $nodeCommand = Get-Command node -ErrorAction Stop
  Write-LogLine "Starting daily blog generation."

  Push-Location $projectRoot
  & $nodeCommand.Source "scripts/generate-blog-post.mjs" 2>&1 | ForEach-Object {
    Write-LogLine "$_"
  }
  Pop-Location

  if ($LASTEXITCODE -ne 0) {
    throw "Blog generation failed with exit code $LASTEXITCODE."
  }

  Write-LogLine "Daily blog generation finished successfully."
}
catch {
  Write-LogLine "ERROR: $($_.Exception.Message)"
  throw
}
