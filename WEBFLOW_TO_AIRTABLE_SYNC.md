# Webflow to Airtable Auto-Sync Guide

## Problem Solved

Previously, Airtable records were only created when a blog received its **first visitor**. This caused:
- Missing blogs in Airtable until someone visited them
- Race condition duplicates when multiple visitors hit a new blog simultaneously
- Incomplete analytics data

**Solution:** Auto-sync all published Webflow blogs to Airtable with 0 views immediately.

---

## How It Works

```
Webflow CMS (Published Blogs)
          ↓
   [Sync Endpoint]
          ↓
Airtable (All Blogs with 0 Views)
          ↓
  [User Visits Blog]
          ↓
Airtable (View Count Increments)
```

---

## Manual Sync

### Option 1: Using PowerShell (Windows)

```powershell
./test-sync-from-webflow.ps1
```

### Option 2: Using curl (Mac/Linux)

```bash
curl -X POST https://blog-view-counter-ten.vercel.app/api/sync-from-webflow
```

### Option 3: Using Browser

Just visit this URL:
```
https://blog-view-counter-ten.vercel.app/api/sync-from-webflow
```

---

## Automatic Sync (Recommended)

Use **Webflow Webhooks** to automatically sync when blogs are published.

### Step 1: Enable Webhooks in Webflow

1. Go to your Webflow site settings
2. Navigate to **Integrations** → **Webhooks**
3. Click **Add Webhook**

### Step 2: Configure Webhook

**Trigger Event:** `collection_item_created` or `collection_item_changed`

**Webhook URL:**
```
https://blog-view-counter-ten.vercel.app/api/sync-from-webflow
```

**Collection:** Select your blog collection

### Step 3: Test It

1. Publish a new blog in Webflow
2. Webflow automatically calls your sync endpoint
3. Check Airtable - the blog should appear with 0 views

---

## Alternative: Scheduled Sync

If you don't have webhook access, schedule periodic syncs:

### Using GitHub Actions (Free)

Create `.github/workflows/sync.yml`:

```yaml
name: Sync Webflow to Airtable
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Sync
        run: |
          curl -X POST https://blog-view-counter-ten.vercel.app/api/sync-from-webflow
```

### Using Vercel Cron Jobs

Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/sync-from-webflow",
    "schedule": "0 */6 * * *"
  }]
}
```

### Using Zapier / Make.com

1. Create a new Zap/Scenario
2. Trigger: **Schedule** (every 6 hours)
3. Action: **Webhooks** → POST to sync endpoint

---

## API Response

### Success Response

```json
{
  "success": true,
  "message": "Sync completed: 5 created, 0 errors",
  "created": [
    {
      "slug": "my-new-blog",
      "title": "My New Blog Post",
      "airtable_id": "recXXXXXXXXXXXXXX",
      "webflow_id": "64a1b2c3d4e5f6g7h8i9"
    }
  ],
  "errors": [],
  "stats": {
    "total_webflow": 50,
    "total_airtable": 45,
    "missing_blogs": 5,
    "created_count": 5,
    "error_count": 0
  }
}
```

### Already Synced Response

```json
{
  "success": true,
  "message": "All Webflow blogs already exist in Airtable",
  "synced": 0,
  "total_webflow": 50,
  "total_airtable": 50
}
```

---

## Best Practices

### 1. Sync After Publishing
Run the sync endpoint **immediately after publishing** new blogs in Webflow:
```bash
# Publish site
# Then sync
curl -X POST https://blog-view-counter-ten.vercel.app/api/sync-from-webflow
```

### 2. Regular Scheduled Syncs
Set up a cron job to sync every 6 hours as a safety net:
- Catches any missed blogs
- Ensures data consistency
- No performance impact (checks before creating)

### 3. Monitor Sync Status
Check the response for errors:
```javascript
if (response.stats.error_count > 0) {
  console.error('Sync errors:', response.errors);
}
```

---

## Workflow Integration

### Recommended Publishing Workflow

```
1. Create blog in Webflow CMS
2. Publish site in Webflow
3. Run sync endpoint (manual or webhook)
4. Verify in Airtable (blog appears with 0 views)
5. Blog is now live and tracked
```

### Automated Workflow (with Webhooks)

```
1. Create blog in Webflow CMS
2. Publish site in Webflow
   ↓ (Webhook automatically triggers)
3. Sync endpoint runs
4. Blog appears in Airtable with 0 views
   ✅ Fully automated!
```

---

## Troubleshooting

### Blog not appearing in Airtable?

1. **Check Webflow slug:** Ensure the blog has a valid slug in Webflow
2. **Check API response:** Look for errors in the sync response
3. **Verify credentials:** Ensure WEBFLOW_API_TOKEN and AIRTABLE_API_KEY are correct
4. **Run manual sync:** Test with the PowerShell script to see detailed output

### Duplicate records in Airtable?

- The endpoint automatically skips existing slugs
- Duplicates should not be created by this sync
- If you see duplicates, they likely came from the old auto-create behavior

### Sync is slow?

- The endpoint uses batch processing (10 records at a time)
- For 100 blogs, expect ~10 seconds total
- Rate limiting prevents API throttling

---

## Benefits

✅ **No more missing blogs** - All published blogs immediately in Airtable
✅ **No more race conditions** - Records exist before first visitor
✅ **Complete analytics** - All blogs tracked from day one
✅ **Clean data** - Consistent 0-view initialization
✅ **Automation ready** - Works with webhooks and cron jobs

---

## Next Steps

1. **Deploy the new endpoint:**
   ```bash
   vercel --prod
   ```

2. **Run initial sync:**
   ```powershell
   ./test-sync-from-webflow.ps1
   ```

3. **Set up automation:**
   - Option A: Enable Webflow webhook (recommended)
   - Option B: Schedule cron job
   - Option C: Manual sync after each publish

4. **Verify:**
   - Check Airtable - all Webflow blogs should be present
   - Publish a new blog and verify it appears with 0 views
