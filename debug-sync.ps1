# Debug: Check what's in Webflow vs Airtable

Write-Host "Fetching all blog data..." -ForegroundColor Cyan

# Get all counts from Airtable
$counts = Invoke-RestMethod -Uri "https://blog-view-counter-ten.vercel.app/api/get-all-counts"

Write-Host "`nTotal blogs in Airtable: $($counts.total)" -ForegroundColor Yellow

Write-Host "`nBlogs with 0 views:" -ForegroundColor Magenta
$counts.posts | Where-Object { $_.total_views -eq 0 } | ForEach-Object {
    Write-Host "  - $($_.slug) (title: $($_.title))" -ForegroundColor Gray
}

Write-Host "`nBlogs with >0 views:" -ForegroundColor Green
$counts.posts | Where-Object { $_.total_views -gt 0 } | Sort-Object -Property total_views -Descending | ForEach-Object {
    Write-Host "  - $($_.slug): $($_.total_views) views (title: $($_.title))" -ForegroundColor White
}

Write-Host "`nTop 5 blogs by views:" -ForegroundColor Cyan
$counts.posts | Sort-Object -Property total_views -Descending | Select-Object -First 5 | ForEach-Object {
    Write-Host "  $($_.total_views) - $($_.slug)" -ForegroundColor Yellow
}
