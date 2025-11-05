# PowerShell Script to Identify and Clean Up Duplicate Blogs in Airtable
# This script helps you identify duplicate slugs and decide which to keep

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Airtable Duplicate Cleanup Utility" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Fetch all blogs from API
Write-Host "Fetching all blogs from Airtable..." -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "https://blog-view-counter-ten.vercel.app/api/get-all-counts" -Method Get
$blogs = $response.posts

Write-Host "Total blogs found: $($blogs.Count)" -ForegroundColor Green
Write-Host ""

# Group by slug to find duplicates
$duplicates = $blogs | Group-Object -Property slug | Where-Object { $_.Count -gt 1 }

if ($duplicates.Count -eq 0) {
    Write-Host "✅ No duplicates found! Your Airtable is clean." -ForegroundColor Green
    exit 0
}

Write-Host "⚠️  Found $($duplicates.Count) duplicate slugs:" -ForegroundColor Red
Write-Host ""

# Display duplicates
$duplicateList = @()
foreach ($group in $duplicates) {
    Write-Host "Slug: '$($group.Name)' (appears $($group.Count) times)" -ForegroundColor Yellow
    Write-Host "----------------------------------------"

    $index = 1
    foreach ($blog in $group.Group) {
        Write-Host "  [$index] Title: $($blog.title)"
        Write-Host "      View Count: $($blog.view_count)"
        Write-Host "      Old Views: $($blog.old_views)"
        Write-Host "      Total Views: $($blog.total_views)"
        Write-Host ""
        $index++
    }

    $duplicateList += $group
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Recommendation" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "For each duplicate slug, you should:" -ForegroundColor Yellow
Write-Host "1. Keep the record with the HIGHEST total_views" -ForegroundColor White
Write-Host "2. Delete the others (they're likely duplicates from old race conditions)" -ForegroundColor White
Write-Host ""
Write-Host "Example for 'seven' (appears 2 times):" -ForegroundColor Cyan
Write-Host "  [1] total_views: 1  <- KEEP THIS" -ForegroundColor Green
Write-Host "  [2] total_views: 0  <- DELETE THIS" -ForegroundColor Red
Write-Host ""

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Manual Cleanup Steps" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To clean up duplicates:" -ForegroundColor Yellow
Write-Host "1. Go to your Airtable: https://airtable.com" -ForegroundColor White
Write-Host "2. Open the 'Blog Posts' table" -ForegroundColor White
Write-Host "3. For each duplicate slug above:" -ForegroundColor White
Write-Host "   - Find all records with that slug" -ForegroundColor White
Write-Host "   - Keep the one with highest total_views" -ForegroundColor White
Write-Host "   - Delete the others" -ForegroundColor White
Write-Host ""

# Generate detailed report
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Detailed Duplicate Report" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

foreach ($group in $duplicates) {
    $sorted = $group.Group | Sort-Object -Property total_views -Descending

    Write-Host "Slug: '$($group.Name)'" -ForegroundColor Yellow

    $keepThis = $sorted[0]
    Write-Host "  ✅ KEEP: $($keepThis.title) (total_views: $($keepThis.total_views))" -ForegroundColor Green

    for ($i = 1; $i -lt $sorted.Count; $i++) {
        $deleteThis = $sorted[$i]
        Write-Host "  ❌ DELETE: $($deleteThis.title) (total_views: $($deleteThis.total_views))" -ForegroundColor Red
    }

    Write-Host ""
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total blogs: $($blogs.Count)" -ForegroundColor White
Write-Host "Unique slugs: $($blogs | Select-Object -Unique slug | Measure-Object | Select-Object -ExpandProperty Count)" -ForegroundColor White
Write-Host "Duplicate slugs: $($duplicates.Count)" -ForegroundColor Red
Write-Host "Records to delete: $(($duplicates | ForEach-Object { $_.Count - 1 } | Measure-Object -Sum).Sum)" -ForegroundColor Red
Write-Host ""
Write-Host "After cleanup, you should have: $(($blogs | Select-Object -Unique slug | Measure-Object | Select-Object -ExpandProperty Count)) blogs" -ForegroundColor Green
Write-Host ""
