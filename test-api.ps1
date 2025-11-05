# PowerShell Test Script for Blog View Counter API
# Make sure to run 'vercel dev' in another terminal first!

$API_URL = "http://localhost:3000"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Blog View Counter API Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Get All Counts
Write-Host "Test 1: Getting all view counts..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/get-all-counts" -Method Get
    Write-Host "Success!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
    Write-Host ""
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 2: Increment Count (Auto-Create Test)
Write-Host "Test 2: Incrementing view count for 'test-blog-post' (will auto-create)..." -ForegroundColor Yellow
try {
    $body = @{
        slug = "test-blog-post"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$API_URL/api/increment-count" -Method Post -Body $body -ContentType "application/json"
    Write-Host "Success!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
    Write-Host ""
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 3: Get Specific Count
Write-Host "Test 3: Getting view count for 'test-blog-post'..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/get-count?slug=test-blog-post" -Method Get
    Write-Host "Success!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
    Write-Host ""
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 4: Increment Again (Update Test)
Write-Host "Test 4: Incrementing view count again for 'test-blog-post' (should update)..." -ForegroundColor Yellow
try {
    $body = @{
        slug = "test-blog-post"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$API_URL/api/increment-count" -Method Post -Body $body -ContentType "application/json"
    Write-Host "Success!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
    Write-Host ""
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 5: Get All Counts Again
Write-Host "Test 5: Getting all view counts again (should show test-blog-post)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/get-all-counts" -Method Get
    Write-Host "Success!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
    Write-Host ""
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Tests Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
