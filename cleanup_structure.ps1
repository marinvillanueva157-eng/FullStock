# FullStock - Legacy cleanup (safe move to /legacy)
$ErrorActionPreference = "Stop"

$root = Get-Location
$legacyDir = Join-Path $root "legacy"
$fullstockShopDir = Join-Path $root "fullstock-shop"

Write-Host "Starting cleanup..."

# Safety check
if (-not (Test-Path $fullstockShopDir)) {
    Write-Error "CRITICAL: folder 'fullstock-shop' not found. Aborting to protect the store."
    exit 1
}

# Create legacy folder
if (-not (Test-Path $legacyDir)) {
    New-Item -ItemType Directory -Path $legacyDir | Out-Null
    Write-Host "OK: legacy folder created."
} else {
    Write-Host "INFO: legacy folder already exists. Reusing it."
}

# Items to move from project root to /legacy
$itemsToMove = @("shop.html", "admin.html", "incoming", "assets", "data", "js", "css")

foreach ($itemName in $itemsToMove) {
    $sourcePath = Join-Path $root $itemName

    if (Test-Path $sourcePath) {
        $destPath = Join-Path $legacyDir $itemName

        # Name conflict handling
        if (Test-Path $destPath) {
            $counter = 1
            $baseName = $itemName
            do {
                $newName = "${baseName}_old_${counter}"
                $destPath = Join-Path $legacyDir $newName
                $counter++
            } while (Test-Path $destPath)

            Write-Host "WARN: conflict for $itemName. Using destination: $destPath"
        }

        Move-Item -Path $sourcePath -Destination $destPath
        Write-Host "MOVED: $itemName -> $destPath"
    } else {
        Write-Host "SKIP: not found in root: $itemName"
    }
}

# Final integrity check for the new store
Write-Host ""
Write-Host "--- Integrity check (new store) ---"

$criticalPaths = @(
    "fullstock-shop\shop.html",
    "fullstock-shop\js\shop.js",
    "fullstock-shop\data\products.generated.json",
    "fullstock-shop\assets\products"
)

foreach ($relPath in $criticalPaths) {
    $fullPath = Join-Path $root $relPath
    if (Test-Path $fullPath) {
        Write-Host "OK: $relPath"
    } else {
        Write-Host "CRITICAL: Missing $relPath"
    }
}
