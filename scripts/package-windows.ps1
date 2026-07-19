param([string]$Node = "")

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$distRoot = Join-Path $projectRoot "dist"
$appOut = Join-Path $distRoot "win-unpacked"
$stage = Join-Path $projectRoot "build\windows-app"
$electronDist = Join-Path $projectRoot "node_modules\electron\dist"
$asarCli = Join-Path $projectRoot "node_modules\@electron\asar\bin\asar.js"
$rcedit = Join-Path $env:LOCALAPPDATA "electron-builder\Cache\winCodeSign\winCodeSign-2.6.0\rcedit-x64.exe"
$makensis = Join-Path $env:LOCALAPPDATA "electron-builder\Cache\nsis\nsis-3.0.4.1\makensis.exe"
$releaseRoot = Join-Path $projectRoot "release"

if (-not $Node) {
    $bundledNode = "C:\Users\hdeyh\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
    $Node = if (Test-Path -LiteralPath $bundledNode) { $bundledNode } else { (Get-Command node -ErrorAction Stop).Source }
}

foreach ($required in @($Node, $electronDist, $asarCli, $rcedit, $makensis)) {
    if (-not (Test-Path -LiteralPath $required)) { throw "Missing Windows build dependency: $required" }
}

foreach ($generated in @($appOut, (Join-Path $stage "src"), (Join-Path $stage "main.js"), (Join-Path $stage "preload.js"))) {
    if (Test-Path -LiteralPath $generated) {
        $resolved = (Resolve-Path -LiteralPath $generated).Path
        if (-not $resolved.StartsWith($projectRoot, [System.StringComparison]::OrdinalIgnoreCase)) { throw "Generated path escaped project: $resolved" }
        Remove-Item -LiteralPath $resolved -Recurse -Force
    }
}

[System.IO.Directory]::CreateDirectory($appOut) | Out-Null
[System.IO.Directory]::CreateDirectory($releaseRoot) | Out-Null
Copy-Item -Path (Join-Path $electronDist "*") -Destination $appOut -Recurse -Force
Rename-Item -LiteralPath (Join-Path $appOut "electron.exe") -NewName "Acta.exe"
Remove-Item -LiteralPath (Join-Path $appOut "resources\default_app.asar") -Force -ErrorAction SilentlyContinue

Copy-Item -LiteralPath (Join-Path $projectRoot "main.js") -Destination $stage -Force
Copy-Item -LiteralPath (Join-Path $projectRoot "preload.js") -Destination $stage -Force
Copy-Item -LiteralPath (Join-Path $projectRoot "src") -Destination $stage -Recurse -Force
& $Node $asarCli pack $stage (Join-Path $appOut "resources\app.asar")
if ($LASTEXITCODE -ne 0) { throw "ASAR packaging failed" }

& $rcedit (Join-Path $appOut "Acta.exe") `
    --set-icon (Join-Path $projectRoot "build\icon.ico") `
    --set-file-version "1.0.2.0" `
    --set-product-version "1.0.2.0" `
    --set-version-string "ProductName" "Acta" `
    --set-version-string "FileDescription" "Acta - Notes and Tasks" `
    --set-version-string "CompanyName" "MogroWang Studio" `
    --set-version-string "LegalCopyright" "Copyright © 2026 MogroWang Studio" `
    --set-version-string "OriginalFilename" "Acta.exe"
if ($LASTEXITCODE -ne 0) { throw "Windows resource editing failed" }

$portableZip = Join-Path $releaseRoot "Acta-1.0.002-DEV-windows-portable.zip"
if (Test-Path -LiteralPath $portableZip) { Remove-Item -LiteralPath $portableZip -Force }
Compress-Archive -Path (Join-Path $appOut "*") -DestinationPath $portableZip -CompressionLevel Optimal

Push-Location $projectRoot
try { & $makensis "/INPUTCHARSET" "UTF8" "build\acta-installer.nsi" }
finally { Pop-Location }
if ($LASTEXITCODE -ne 0) { throw "NSIS installer compilation failed" }

Get-Item (Join-Path $appOut "Acta.exe"), $portableZip, (Join-Path $releaseRoot "Acta-1.0.002-DEV-windows-setup.exe") |
    Select-Object FullName, Length, LastWriteTime
