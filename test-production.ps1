# Test Production API on Vercel
$API_URL = "https://blog-view-counter-ten.vercel.app"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Production API" -ForegroundColor Cyan
Write-Host "URL: $API_URL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test: Get All Counts
Write-Host "Test: Getting all view counts from production..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/get-all-counts" -Method Get
    Write-Host "Success!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
    Write-Host ""
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Make sure environment variables are set in Vercel!" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Production Test Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
