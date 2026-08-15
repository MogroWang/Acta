param(
    [ValidateSet('installer', 'portable')]
    [string]$Mode = 'installer',
    [string]$ToolchainRoot = $(if ($env:ACTA_TOOLCHAIN_ROOT) { $env:ACTA_TOOLCHAIN_ROOT } else { 'E:\ActaBuildTools\tooling' }),
    [string]$VsDevCmd = $(if ($env:ACTA_VSDEVCMD) { $env:ACTA_VSDEVCMD } else { 'E:\ActaBuildTools\vs-buildtools\Common7\Tools\VsDevCmd.bat' })
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot

if (-not (Test-Path -LiteralPath $VsDevCmd)) {
    throw "VsDevCmd.bat not found at '$VsDevCmd'. Pass -VsDevCmd or set ACTA_VSDEVCMD."
}
if (-not (Test-Path -LiteralPath (Join-Path $ToolchainRoot 'rustup'))) {
    throw "Rust toolchain not found under '$ToolchainRoot'. Pass -ToolchainRoot or set ACTA_TOOLCHAIN_ROOT."
}

$vsEnvironment = & cmd.exe /d /s /c "`"$VsDevCmd`" -arch=x64 -host_arch=x64 >nul && set"
foreach ($line in $vsEnvironment) {
    if ($line -match '^([^=]+)=(.*)$') {
        Set-Item -Path "env:$($matches[1])" -Value $matches[2]
    }
}

$env:RUSTUP_HOME = Join-Path $ToolchainRoot 'rustup'
$env:CARGO_HOME = Join-Path $ToolchainRoot 'cargo'
$env:PATH = "$env:CARGO_HOME\bin;$env:PATH"
$env:RUSTUP_DIST_SERVER = 'https://rsproxy.cn'
$env:CARGO_REGISTRIES_CRATES_IO_PROTOCOL = 'sparse'
$env:CARGO_REGISTRIES_CRATES_IO_INDEX = 'sparse+https://rsproxy.cn/index/'
$env:CARGO_HTTP_TIMEOUT = '120'
$env:TAURI_BUNDLER_TOOLS_GITHUB_MIRROR_TEMPLATE = 'https://gh-proxy.com/https://github.com/<owner>/<repo>/releases/download/<version>/<asset>'

Set-Location -LiteralPath $projectRoot

Write-Output "Rust: $(& rustc --version)"
Write-Output "Cargo: $(& cargo --version)"
Write-Output "Starting Tauri Windows x64 $Mode build..."

if ($Mode -eq 'portable') {
    & npm.cmd run windows:portable
} else {
    & npm.cmd run windows:build
}
exit $LASTEXITCODE
