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
  # Codex CLI may be installed as a native executable or a Node/npm .cmd shim.
  $command = Get-Command -Name @("codex.exe", "codex.cmd", "codex") -ErrorAction SilentlyContinue |
    Where-Object { $_.Source -and (Test-Path -LiteralPath $_.Source -PathType Leaf) } |
    Select-Object -First 1
  if ($command) { return $command.Source }
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

# Every write target is outside many Codex sandbox workspaces. Probe before making
# changes, so a permission error gives a useful recovery path rather than a half-install.
function Assert-WritableDirectory {
  param([Parameter(Mandatory=$true)][string]$Directory)
  $probePath = $null
  try {
    New-Item -ItemType Directory -Force -Path $Directory | Out-Null
    $probePath = Join-Path $Directory (".hebrew-rtl-test-" + [guid]::NewGuid().ToString("N"))
    [System.IO.File]::WriteAllText($probePath, "ok")
  } catch {
    throw "Cannot write to $Directory. Codex's sandbox or your Windows permissions may block this installer. Run Install.cmd from an extracted GitHub ZIP in Windows Explorer, OUTSIDE the Codex chat; do not run as administrator or disable security protections. Original error: $($_.Exception.Message)"
  } finally {
    if ($probePath -and (Test-Path -LiteralPath $probePath)) {
      Remove-Item -LiteralPath $probePath -Force -ErrorAction SilentlyContinue
    }
  }
}

$codexCli = $null
if (-not $SkipPlugin) { $codexCli = Find-CodexCli }

$nodeExe = Find-Node
$codexExe = Find-CodexApp
if (-not $nodeExe) { throw "Node.js 22 or later is required. Install the current Node.js LTS, then run this installer again." }
if (-not $codexExe) { throw "Could not find the Codex desktop app. Install Codex Desktop, then run this installer again." }

$codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $env:USERPROFILE ".codex" }
Assert-WritableDirectory -Directory $codexHome
Assert-WritableDirectory -Directory $localRoot
Assert-WritableDirectory -Directory $shortcutDirectory

# The Codex plugin is optional. If its CLI/cache is missing or blocked, the
# globally installed AGENTS.md and the desktop RTL launcher still work.
$pluginInstalled = $false
if (-not $SkipPlugin) {
  if ($codexCli) {
    Write-Host "Trying Codex plugin installation..."
    $oldErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
      & $codexCli plugin marketplace add "financialegg/chatgpt-hebrew-rtl"
      $marketplaceExit = $LASTEXITCODE
      if ($marketplaceExit -ne 0) {
        & $codexCli plugin marketplace upgrade "financialegg-hebrew-rtl"
        $marketplaceExit = $LASTEXITCODE
      }
      if ($marketplaceExit -eq 0) {
        & $codexCli plugin add "hebrew-rtl@financialegg-hebrew-rtl"
        $pluginInstalled = ($LASTEXITCODE -eq 0)
      }
    } catch {
      Write-Warning "Codex plugin step returned an error: $($_.Exception.Message)"
    } finally {
      $ErrorActionPreference = $oldErrorActionPreference
    }
  }
  if (-not $pluginInstalled) {
    Write-Warning "OPTIONAL PLUGIN NOT INSTALLED. Continuing with global AGENTS.md writing rules and the desktop RTL launcher. Do not describe this as a full plugin installation."
  }
} else {
  Write-Host "Codex plugin installation intentionally skipped (-SkipPlugin)."
}

# Global Codex instructions: keep the user's own content, add or refresh our Hebrew rules block.
$agentsPath = Join-Path $codexHome "AGENTS.md"
$rulesText = [System.IO.File]::ReadAllText((Join-Path $repoRoot "codex\AGENTS.md")).Trim()
$startMark = "<!-- hebrew-rtl:start -->"
$endMark = "<!-- hebrew-rtl:end -->"
$block = "$startMark`r`n$rulesText`r`n$endMark`r`n"
$existing = if (Test-Path -LiteralPath $agentsPath) { [System.IO.File]::ReadAllText($agentsPath) } else { "" }
$heading = "# Global Hebrew RTL response instructions for Codex"
$s = $existing.IndexOf($startMark); $e = $existing.IndexOf($endMark)
if ($s -ge 0 -and $e -gt $s) {
  $updated = $existing.Substring(0, $s) + $block + $existing.Substring($e + $endMark.Length).TrimStart("`r", "`n")
} elseif ($existing.IndexOf($heading) -ge 0) {
  # ponytail: an unmarked block came from the first installer, which always appended it last, so it runs to the end of the file
  $updated = $existing.Substring(0, $existing.IndexOf($heading)) + $block
} else {
  $separator = if ($existing.Trim()) { "`r`n`r`n---`r`n`r`n" } else { "" }
  $updated = $existing + $separator + $block
}
if ($updated -ne $existing) {
  New-Item -ItemType Directory -Force -Path $codexHome | Out-Null
  [System.IO.File]::WriteAllText($agentsPath, $updated, (New-Object System.Text.UTF8Encoding($false)))
  Write-Host "Hebrew writing rules installed in $agentsPath"
} else {
  Write-Host "Hebrew writing rules already up to date in $agentsPath"
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

Write-Host ""
Write-Host "INSTALLATION STATUS:" -ForegroundColor Cyan
Write-Host "  GLOBAL HEBREW WRITING RULES: INSTALLED (AGENTS.md)" -ForegroundColor Green
Write-Host "  DESKTOP RTL LAUNCHER: FILES AND SHORTCUT INSTALLED (not yet active)" -ForegroundColor Green
if ($pluginInstalled) {
  Write-Host "  OPTIONAL CODEX PLUGIN: INSTALLED" -ForegroundColor Green
} else {
  Write-Host "  OPTIONAL CODEX PLUGIN: NOT INSTALLED" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Save work and fully close Codex. Open Start > FinancialEgg > Codex with Hebrew RTL."
Write-Host "Keep the launcher console open. Confirm that it reports an injected/active RTL engine; then test text in a NEW Codex chat."
Write-Host "A successful installer exit alone does not prove that the on-screen RTL display was activated."
