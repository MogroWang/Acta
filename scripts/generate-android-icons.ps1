param(
    [string]$Source = (Join-Path $PSScriptRoot "..\..\Acta logo-3x.png")
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$resRoot = Join-Path $projectRoot "android\app\src\main\res"
$sourceImage = [System.Drawing.Image]::FromFile((Resolve-Path $Source).Path)

function Write-Icon {
    param(
        [int]$Size,
        [string]$Path,
        [double]$ContentScale = 1.0,
        [bool]$TransparentCanvas = $false
    )

    $directory = Split-Path $Path -Parent
    [System.IO.Directory]::CreateDirectory($directory) | Out-Null
    $bitmap = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $bitmap.SetResolution(96, 96)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.Clear($(if ($TransparentCanvas) { [System.Drawing.Color]::Transparent } else { [System.Drawing.Color]::White }))

    $box = [int][Math]::Round($Size * $ContentScale)
    $ratio = [Math]::Min($box / $sourceImage.Width, $box / $sourceImage.Height)
    $width = [int][Math]::Round($sourceImage.Width * $ratio)
    $height = [int][Math]::Round($sourceImage.Height * $ratio)
    $x = [int][Math]::Round(($Size - $width) / 2)
    $y = [int][Math]::Round(($Size - $height) / 2)
    $graphics.DrawImage($sourceImage, $x, $y, $width, $height)
    $graphics.Dispose()
    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap.Dispose()
}

function Write-WindowsIco {
    param([string]$Path)
    $sizes = @(16, 24, 32, 48, 64, 128, 256)
    $temporaryDirectory = Join-Path $projectRoot "build\ico-parts"
    [System.IO.Directory]::CreateDirectory($temporaryDirectory) | Out-Null
    $parts = [System.Collections.Generic.List[byte[]]]::new()
    foreach ($size in $sizes) {
        $partPath = Join-Path $temporaryDirectory ("icon-" + $size + ".png")
        Write-Icon -Size $size -Path $partPath
        $parts.Add([System.IO.File]::ReadAllBytes($partPath))
    }

    $stream = [System.IO.File]::Create($Path)
    $writer = New-Object System.IO.BinaryWriter($stream)
    $writer.Write([uint16]0)
    $writer.Write([uint16]1)
    $writer.Write([uint16]$parts.Count)
    $offset = 6 + (16 * $parts.Count)
    for ($index = 0; $index -lt $parts.Count; $index++) {
        $size = $sizes[$index]
        $writer.Write([byte]$(if ($size -eq 256) { 0 } else { $size }))
        $writer.Write([byte]$(if ($size -eq 256) { 0 } else { $size }))
        $writer.Write([byte]0)
        $writer.Write([byte]0)
        $writer.Write([uint16]1)
        $writer.Write([uint16]32)
        $writer.Write([uint32]$parts[$index].Length)
        $writer.Write([uint32]$offset)
        $offset += $parts[$index].Length
    }
    foreach ($part in $parts) { $writer.Write($part) }
    $writer.Dispose()
    $stream.Dispose()
    Remove-Item -LiteralPath $temporaryDirectory -Recurse -Force
}

$densities = @(
    @{ Name = "mdpi"; Legacy = 48; Foreground = 108 },
    @{ Name = "hdpi"; Legacy = 72; Foreground = 162 },
    @{ Name = "xhdpi"; Legacy = 96; Foreground = 216 },
    @{ Name = "xxhdpi"; Legacy = 144; Foreground = 324 },
    @{ Name = "xxxhdpi"; Legacy = 192; Foreground = 432 }
)

foreach ($density in $densities) {
    $folder = Join-Path $resRoot ("mipmap-" + $density.Name)
    Write-Icon -Size $density.Legacy -Path (Join-Path $folder "ic_launcher.png")
    Write-Icon -Size $density.Legacy -Path (Join-Path $folder "ic_launcher_round.png")
    Write-Icon -Size $density.Foreground -Path (Join-Path $folder "ic_launcher_foreground.png") -ContentScale 0.66 -TransparentCanvas $true
}

Write-Icon -Size 512 -Path (Join-Path $projectRoot "android\app\src\main\ic_launcher-playstore.png")
[System.IO.Directory]::CreateDirectory((Join-Path $projectRoot "resources")) | Out-Null
Write-Icon -Size 512 -Path (Join-Path $projectRoot "resources\acta-icon-512.png")
Write-Icon -Size 512 -Path (Join-Path $projectRoot "resources\icon.png")
Write-Icon -Size 1024 -Path (Join-Path $projectRoot "build\icon.png")
Write-WindowsIco -Path (Join-Path $projectRoot "build\icon.ico")

$pwaSizes = @(72, 96, 128, 144, 152, 192, 384, 512)
foreach ($size in $pwaSizes) {
    Write-Icon -Size $size -Path (Join-Path $projectRoot ("src\icons\icon-" + $size + ".png"))
}
Write-Icon -Size 192 -Path (Join-Path $projectRoot "src\icons\icon-192-maskable.png") -ContentScale 0.8
Write-Icon -Size 512 -Path (Join-Path $projectRoot "src\icons\icon-512-maskable.png") -ContentScale 0.8

$sourceImage.Dispose()
Write-Output "Generated Android, Windows, PWA, and About icons from Acta logo-3x.png."
