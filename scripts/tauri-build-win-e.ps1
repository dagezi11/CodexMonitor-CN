param(
  [switch]$CheckOnly,
  [switch]$SkipDoctor
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$EnvRoot = "E:\CodexMonitorEnv"
$LlvmRoot = Join-Path $EnvRoot "LLVM"
$LlvmBin = Join-Path $LlvmRoot "bin"
$TempRoot = Join-Path $EnvRoot "tmp"
$CargoTargetDir = Join-Path $EnvRoot "cargo-target\CodexMonitor-CN"
$RustToolchain = "1.89.0-x86_64-pc-windows-msvc"
$VsDevCmdPath = "D:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat"

function Write-Step {
  param([string]$Message)
  Write-Host "[win-e] $Message"
}

function Ensure-Directory {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    New-Item -Path $Path -ItemType Directory -Force | Out-Null
  }
}

function Ensure-Command {
  param([string]$Name)
  $command = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $command) {
    throw "Missing command: $Name"
  }
}

function Invoke-External {
  param(
    [string]$Command,
    [string[]]$Arguments
  )
  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed ($LASTEXITCODE): $Command $($Arguments -join ' ')"
  }
}

function Import-VsDevCmdEnvironment {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    throw "VsDevCmd.bat not found: $Path"
  }

  $output = cmd.exe /s /c "`"$Path`" -no_logo -arch=x64 -host_arch=x64 && set"
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to initialize Visual Studio build environment"
  }

  foreach ($line in $output) {
    if ($line -match "^([^=]+)=(.*)$") {
      [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
    }
  }
}

function Set-BuildEnvironment {
  Ensure-Directory -Path $TempRoot
  Ensure-Directory -Path $CargoTargetDir

  if (-not (Test-Path (Join-Path $LlvmBin "libclang.dll"))) {
    throw "Missing libclang.dll: $(Join-Path $LlvmBin 'libclang.dll')"
  }

  $processPath = [Environment]::GetEnvironmentVariable("Path", "Process")
  if ($processPath -notlike "$LlvmBin*") {
    [Environment]::SetEnvironmentVariable("Path", "$LlvmBin;$processPath", "Process")
  }

  [Environment]::SetEnvironmentVariable("LIBCLANG_PATH", $LlvmBin, "Process")
  [Environment]::SetEnvironmentVariable("TEMP", $TempRoot, "Process")
  [Environment]::SetEnvironmentVariable("TMP", $TempRoot, "Process")
  [Environment]::SetEnvironmentVariable("CARGO_TARGET_DIR", $CargoTargetDir, "Process")
  [Environment]::SetEnvironmentVariable("RUSTUP_TOOLCHAIN", $RustToolchain, "Process")
}

function Validate-Prerequisites {
  Ensure-Command -Name clang
  Ensure-Command -Name cmake
  Ensure-Command -Name rustup
  Ensure-Command -Name cl
  Ensure-Command -Name link

  $toolchains = (& rustup toolchain list) -join "`n"
  if ($toolchains -notmatch [Regex]::Escape($RustToolchain)) {
    throw "Missing rust toolchain: $RustToolchain"
  }

  & clang --version | Select-Object -First 1 | Write-Host
  & rustc --version | Write-Host
  & cmake --version | Select-Object -First 1 | Write-Host
}

try {
  Write-Step "Initialize MSVC environment"
  Import-VsDevCmdEnvironment -Path $VsDevCmdPath

  Write-Step "Apply E-drive build environment"
  Set-BuildEnvironment

  Write-Step "Validate prerequisites"
  Validate-Prerequisites

  if ($CheckOnly) {
    Write-Step "Check-only completed successfully"
    exit 0
  }

  Push-Location $RepoRoot
  try {
    Write-Step "Sync material icons"
    Invoke-External -Command npm -Arguments @("run", "sync:material-icons")

    if (-not $SkipDoctor) {
      Write-Step "Run doctor:win"
      Invoke-External -Command npm -Arguments @("run", "doctor:win")
    }

    Write-Step "Build Windows bundle"
    Invoke-External -Command npm -Arguments @("exec", "--", "tauri", "build", "--config", "src-tauri/tauri.windows.conf.json")
  }
  finally {
    Pop-Location
  }

  Write-Step "Done"
}
catch {
  Write-Error $_
  exit 1
}
