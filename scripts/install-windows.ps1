[CmdletBinding()]
param(
  [switch]$SkipPlugin,
  [string]$InstallRoot = (Join-Path $env:LOCALAPPDATA "FinancialEgg\HebrewRTL"),
  [string]$ShortcutDirectory = (Join-Path ([Environment]::GetFolderPath("Programs")) "FinancialEgg"),
  [string]$CodexCliOverride,
  [string]$CodexExeOverride,
  [string]$NodeExeOverride
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$localRoot = [System.IO.Path]::GetFullPath($InstallRoot)
$shortcutDirectory = [System.IO.Path]::GetFullPath($ShortcutDirectory)
$shortcutPath = Join-Path $shortcutDirectory "Codex with Hebrew RTL.lnk"

function Find-CodexCli {
  if ($CodexCliOverride) {
    if (Test-Path -LiteralPath $CodexCliOverride -PathType Leaf) { return (Resolve-Path -LiteralPath $CodexCliOverride).Path }
    throw "Codex CLI executable not found: $CodexCliOverride"
  }
  $root = Join-Path $env:LOCALAPPDATA "OpenAI\Codex\bin"
  if (Test-Path -LiteralPath $root) {
    $found = Get-ChildItem -LiteralPath $root -Directory -ErrorAction SilentlyContinue |
      ForEach-Object { Join-Path $_.FullName "codex.exe" } |
      Where-Object { Test-Path -LiteralPath $_ } |
      ForEach-Object { Get-Item -LiteralPath $_ } |
      Sort-Object LastWriteTime -Descending |
      Select-Object -First 1 -ExpandProperty FullName
    if ($found) { return $found }
  }
  $command = Get-Command "codex.exe" -ErrorAction SilentlyContinue
  if ($command -and (Test-Path -LiteralPath $command.Source -PathType Leaf)) { return $command.Source }
}

function Find-CodexApp {
  if ($CodexExeOverride) {
    if (Test-Path -LiteralPath $CodexExeOverride -PathType Leaf) { return (Resolve-Path -LiteralPath $CodexExeOverride).Path }
    throw "Codex desktop executable not found: $CodexExeOverride"
  }

  $runningApp = Get-Process -Name "Codex", "ChatGPT" -ErrorAction SilentlyContinue |
    Where-Object { $_.Path -and (Test-Path -LiteralPath $_.Path -PathType Leaf) } |
    Select-Object -First 1 -ExpandProperty Path
  if ($runningApp) { return $runningApp }

  $package = Get-AppxPackage -Name "OpenAI.Codex" -ErrorAction SilentlyContinue |
    Sort-Object Version -Descending |
    Select-Object -First 1
  if ($package) {
    foreach ($relativePath in @("app\ChatGPT.exe", "app\Codex.exe")) {
      $candidate = Join-Path $package.InstallLocation $relativePath
      if (Test-Path -LiteralPath $candidate) { return $candidate }
    }
  }

  foreach ($candidate in @(
    (Join-Path $env:LOCALAPPDATA "Programs\Codex\Codex.exe"),
    (Join-Path $env:LOCALAPPDATA "Programs\ChatGPT\ChatGPT.exe"),
    (Join-Path $env:ProgramFiles "Codex\Codex.exe")
  )) {
    if (Test-Path -LiteralPath $candidate) { return $candidate }
  }
  return $null
}

function Find-Node {
  $nodePath = $NodeExeOverride
  if (-not $nodePath) {
    $command = Get-Command "node.exe" -ErrorAction SilentlyContinue
    if (-not $command) { return $null }
    $nodePath = $command.Source
  } elseif (-not (Test-Path -LiteralPath $nodePath -PathType Leaf)) {
    throw "Node.js executable not found: $nodePath"
  }
  $versionText = & $nodePath --version
  if ($versionText -notmatch '^v(\d+)\.') { return $null }
  if ([int]$Matches[1] -lt 22) { return $null }
  return (Resolve-Path -LiteralPath $nodePath).Path
}

$codexCli = $null
if (-not $SkipPlugin) {
  $codexCli = Find-CodexCli
  if (-not $codexCli) {
    throw "Codex CLI was not found under %LOCALAPPDATA%\OpenAI\Codex\bin. Install Codex CLI or run this from a Codex installation that includes the CLI."
  }
}

$nodeExe = Find-Node
$codexExe = Find-CodexApp
if (-not $nodeExe) { throw "Node.js 22 or later is required. Install the current Node.js LTS, then run this installer again." }
if (-not $codexExe) { throw "Could not find the Codex desktop app. Install Codex Desktop, then run this installer again." }

if (-not $SkipPlugin) {
  & $codexCli plugin marketplace add "financialegg/chatgpt-hebrew-rtl"
  if ($LASTEXITCODE -ne 0) {
    & $codexCli plugin marketplace upgrade "financialegg-hebrew-rtl"
    if ($LASTEXITCODE -ne 0) { throw "Could not add or update the Hebrew RTL plugin marketplace." }
  }
  & $codexCli plugin add "hebrew-rtl@financialegg-hebrew-rtl"
  if ($LASTEXITCODE -ne 0) { throw "Could not install the Hebrew RTL Codex plugin." }
}

# Global Codex instructions: add the Hebrew rules once, keeping whatever the user already has.
$codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $env:USERPROFILE ".codex" }
$agentsPath = Join-Path $codexHome "AGENTS.md"
$rulesText = [System.IO.File]::ReadAllText((Join-Path $repoRoot "codex\AGENTS.md"))
$existing = if (Test-Path -LiteralPath $agentsPath) { [System.IO.File]::ReadAllText($agentsPath) } else { "" }
if ($existing -notmatch [regex]::Escape("# Global Hebrew RTL response instructions for Codex")) {
  New-Item -ItemType Directory -Force -Path $codexHome | Out-Null
  $separator = if ($existing.Trim()) { "`r`n`r`n---`r`n`r`n" } else { "" }
  [System.IO.File]::AppendAllText($agentsPath, $separator + $rulesText, (New-Object System.Text.UTF8Encoding($false)))
  Write-Host "Added the Hebrew writing rules to $agentsPath"
} else {
  Write-Host "Hebrew writing rules already present in $agentsPath"
}

New-Item -ItemType Directory -Force -Path (Join-Path $localRoot "core"), (Join-Path $localRoot "desktop"), $shortcutDirectory | Out-Null
Copy-Item -LiteralPath (Join-Path $repoRoot "core\rtl-engine.js") -Destination (Join-Path $localRoot "core\rtl-engine.js") -Force
Copy-Item -LiteralPath (Join-Path $repoRoot "desktop\launcher.mjs") -Destination (Join-Path $localRoot "desktop\launcher.mjs") -Force

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $nodeExe
$shortcut.Arguments = '"' + (Join-Path $localRoot "desktop\launcher.mjs") + '" --exe "' + $codexExe + '"'
$shortcut.WorkingDirectory = $localRoot
$shortcut.Description = "Launch Codex with Hebrew RTL display support"
$shortcut.IconLocation = $codexExe + ",0"
$shortcut.Save()

if ($SkipPlugin) {
  Write-Host "Created the Start menu shortcut: FinancialEgg > Codex with Hebrew RTL"
} else {
  Write-Host "Installed the Hebrew RTL plugin and created the Start menu shortcut: FinancialEgg > Codex with Hebrew RTL"
}
Write-Host "Close Codex completely, then launch it from that shortcut. Keep the opened console window running while you use Codex."
