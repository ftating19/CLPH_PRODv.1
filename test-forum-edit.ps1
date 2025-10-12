# PowerShell script to test forum edit tracking
# Run this from the project root directory

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Forum Edit Tracking Test Script" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "backend\test-forum-edit.js")) {
    Write-Host "ERROR: Please run this script from the project root directory" -ForegroundColor Red
    Write-Host "Current directory: $PWD" -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Running database check..." -ForegroundColor Yellow
Write-Host ""

Set-Location backend
node test-forum-edit.js

$exitCode = $LASTEXITCODE
Set-Location ..

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "==================================" -ForegroundColor Green
    Write-Host "TEST PASSED!" -ForegroundColor Green
    Write-Host "==================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Restart your backend server" -ForegroundColor White
    Write-Host "2. Refresh your frontend (Ctrl+Shift+R)" -ForegroundColor White
    Write-Host "3. Edit a forum post" -ForegroundColor White
    Write-Host "4. The 'Edited' badge should appear" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "==================================" -ForegroundColor Red
    Write-Host "TEST FAILED!" -ForegroundColor Red
    Write-Host "==================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please follow the error message above to fix the issue." -ForegroundColor Yellow
    Write-Host "Check the troubleshooting guide: docs\FORUM_EDIT_TROUBLESHOOTING.md" -ForegroundColor Yellow
}

Write-Host ""
