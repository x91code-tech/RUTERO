$ErrorActionPreference = 'Stop'

# Copia rutero icons a mipmap folders
# Calcular la ruta raíz del proyecto de forma robusta
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$projectRoot = Split-Path -Parent $scriptDir
$brandDir = Join-Path $projectRoot "public\brand"
$mipmapDirs = @(
    "android\app\src\main\res\mipmap-hdpi",
    "android\app\src\main\res\mipmap-mdpi",
    "android\app\src\main\res\mipmap-xhdpi",
    "android\app\src\main\res\mipmap-xxhdpi",
    "android\app\src\main\res\mipmap-xxxhdpi",
    "android\app\src\main\res\mipmap-anydpi-v26"
)

$foreground = Join-Path $brandDir "rutero-isotipo.png"
$launcher = Join-Path $brandDir "rutero-logo.png"

if (-not (Test-Path $foreground)) { Write-Error "No se encontró $foreground at $foreground"; exit 1 }
if (-not (Test-Path $launcher)) { Write-Error "No se encontró $launcher at $launcher"; exit 1 }

foreach ($dir in $mipmapDirs) {
    $targetDir = Join-Path $projectRoot $dir
    if (-not (Test-Path $targetDir)) { Write-Warning "No existe $targetDir, saltando"; continue }
    # Overwrite foreground
    Copy-Item -Path $foreground -Destination (Join-Path $targetDir "ic_launcher_foreground.png") -Force
    # Overwrite launcher (fallback)
    Copy-Item -Path $launcher -Destination (Join-Path $targetDir "ic_launcher.png") -Force
    Copy-Item -Path $launcher -Destination (Join-Path $targetDir "ic_launcher_round.png") -Force
}

Write-Output "Iconos copiados. Ahora limpia y rebuild en Android Studio o ejecuta:\n  cd android\n  .\\gradlew.bat clean assembleDebug"
