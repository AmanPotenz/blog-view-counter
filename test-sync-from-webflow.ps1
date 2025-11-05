# Test Webflow to Airtable Sync
# This syncs all published Webflow blogs to Airtable with 0 views

Write-Host "Testing Webflow to Airtable sync..." -ForegroundColor Cyan

# Call the sync endpoint
$response = Invoke-RestMethod `
    -Uri "https://blog-view-counter-ten.vercel.app/api/sync-from-webflow" `
    -Method POST `
    -ContentType "application/json"

Write-Host "`nSync Result:" -ForegroundColor Green
$response | ConvertTo-Json -Depth 5

Write-Host "`nStats:" -ForegroundColor Yellow
Write-Host "Total Webflow blogs: $($response.stats.total_webflow)"
Write-Host "Total Airtable records: $($response.stats.total_airtable)"
Write-Host "Missing blogs: $($response.stats.missing_blogs)"
Write-Host "Created: $($response.stats.created_count)"
Write-Host "Errors: $($response.stats.error_count)"

if ($response.created.Count -gt 0) {
    Write-Host "`nCreated blogs:" -ForegroundColor Green
    $response.created | ForEach-Object {
        Write-Host "  - $($_.slug) ($($_.title))"
    }
}

if ($response.errors.Count -gt 0) {
    Write-Host "`nErrors:" -ForegroundColor Red
    $response.errors | ForEach-Object {
        Write-Host "  - $($_.slug): $($_.error)"
    }
}
