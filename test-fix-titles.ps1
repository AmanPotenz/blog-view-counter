# Fix Missing Titles in Airtable
# This fetches titles from Webflow and updates Airtable records

Write-Host "Fixing missing titles in Airtable..." -ForegroundColor Cyan

# Call the fix endpoint
$response = Invoke-RestMethod `
    -Uri "https://blog-view-counter-ten.vercel.app/api/fix-missing-titles" `
    -Method POST `
    -ContentType "application/json"

Write-Host "`nFix Result:" -ForegroundColor Green
$response | ConvertTo-Json -Depth 5

Write-Host "`nStats:" -ForegroundColor Yellow
Write-Host "Total checked: $($response.stats.total_checked)"
Write-Host "Needed fix: $($response.stats.needed_fix)"
Write-Host "Updated: $($response.stats.updated_count)"
Write-Host "Errors: $($response.stats.error_count)"

if ($response.updated.Count -gt 0) {
    Write-Host "`nUpdated records:" -ForegroundColor Green
    $response.updated | ForEach-Object {
        Write-Host "  - $($_.slug) -> `"$($_.title)`""
    }
}

if ($response.errors.Count -gt 0) {
    Write-Host "`nErrors:" -ForegroundColor Red
    $response.errors | ForEach-Object {
        Write-Host "  - $($_.slug): $($_.error)"
    }
}
