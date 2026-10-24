param(
  [string]$SourcePath = 'D:\game\wh40_testvers\assets'
)
$ErrorActionPreference = 'Stop'
$ProjectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$TargetRoot = Join-Path $ProjectRoot 'assets'
$InventoryPath = Join-Path $ProjectRoot 'tools\assets-inventory.json'
$AvailabilityPath = Join-Path $ProjectRoot 'js\content\assets-availability.js'
$ReportPath = Join-Path $ProjectRoot 'ASSET_IMPORT_REPORT.txt'
$inventory = Get-Content -LiteralPath $InventoryPath -Raw -Encoding UTF8 | ConvertFrom-Json
$sourceExists = Test-Path -LiteralPath $SourcePath -PathType Container
$copied = 0
$alreadyPresent = 0
$sourceFull = $null
if ($sourceExists) {
  $sourceFull = [System.IO.Path]::GetFullPath((Resolve-Path -LiteralPath $SourcePath).Path).TrimEnd('\')
  $targetFull = [System.IO.Path]::GetFullPath((Resolve-Path -LiteralPath $TargetRoot).Path).TrimEnd('\')
  foreach ($item in $inventory.files) {
    if ($item.type -notin @('image','audio')) { continue }
    $relative = $item.path.Substring('assets/'.Length).Replace('/','\')
    $sourceFile = Join-Path $sourceFull $relative
    $destFile = Join-Path $TargetRoot $relative
    if (-not (Test-Path -LiteralPath $sourceFile -PathType Leaf)) { continue }
    if ($sourceFull -eq $targetFull) { $alreadyPresent++; continue }
    $destDir = Split-Path -Parent $destFile
    if (-not (Test-Path -LiteralPath $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
    Copy-Item -LiteralPath $sourceFile -Destination $destFile -Force
    $copied++
  }
}
$extensions = @('.png','.jpg','.jpeg','.webp','.gif','.svg','.ogg','.mp3','.wav')
$available = @()
Get-ChildItem -LiteralPath $TargetRoot -File -Recurse | Where-Object { $extensions -contains $_.Extension.ToLowerInvariant() } | ForEach-Object {
  $rel = $_.FullName.Substring($ProjectRoot.Length + 1).Replace('\','/')
  $available += $rel
}
$available = @($available | Sort-Object -Unique)
$availableSet = @{}
foreach ($p in $available) { $availableSet[$p] = $true }
$missing = @($inventory.files | Where-Object { -not $availableSet.ContainsKey($_.path) })
$filesJson = ConvertTo-Json -InputObject ([object[]]$available) -Compress -Depth 4
$status = [ordered]@{
  source = if ($sourceExists) { $sourceFull } else { 'not-found; using packaged artwork and fallbacks' }
  expected = [int]$inventory.expectedFileCount
  available = [int](@($inventory.files | Where-Object { $availableSet.ContainsKey($_.path) }).Count)
  missing = [int]$missing.Count
  copiedFromSource = [int]$copied
  sourceAlreadyWasTarget = [bool]($sourceExists -and $sourceFull -eq $targetFull)
  generatedAt = (Get-Date).ToString('s')
}
$statusJson = ConvertTo-Json -InputObject $status -Compress -Depth 4
$js = "/* Generated at launch by tools/import-user-assets.ps1. Do not edit manually. */`r`nconst __wh40kAssetFiles = new Set($filesJson);`r`nconst __wh40kAssetStatus = $statusJson;`r`nif (typeof window !== 'undefined') { window.ASSET_AVAILABLE_FILES = __wh40kAssetFiles; window.ASSET_IMPORT_STATUS = __wh40kAssetStatus; } else if (typeof globalThis !== 'undefined') { globalThis.ASSET_AVAILABLE_FILES = __wh40kAssetFiles; globalThis.ASSET_IMPORT_STATUS = __wh40kAssetStatus; }`r`n"
[System.IO.File]::WriteAllText($AvailabilityPath, $js, [System.Text.UTF8Encoding]::new($false))
$lines = @(
  'WARHAMMER 40,000 — ASSET IMPORT REPORT',
  "Source folder available: $sourceExists",
  "Source path: $SourcePath",
  "Files in expected inventory: $($inventory.expectedFileCount)",
  "Images expected: $($inventory.imageCount)",
  "Audio files expected: $($inventory.audioCount)",
  "Media files currently available in release folder: $($available.Count)",
  "Expected inventory files currently available: $($status.available)",
  "Expected files missing: $($status.missing)",
  "Files copied from source folder: $copied",
  "Assets already in target source folder: $alreadyPresent",
  '',
  'Missing expected paths:'
)
if ($missing.Count -gt 0) { $lines += ($missing | ForEach-Object { ' - ' + $_.path }) } else { $lines += ' - none' }
[System.IO.File]::WriteAllLines($ReportPath, $lines, [System.Text.UTF8Encoding]::new($false))
Write-Host ($lines -join "`n")
Write-Host "Availability map updated: $AvailabilityPath"
# Import is intentionally non-fatal: the game uses local fallbacks when a path is unavailable.
exit 0
