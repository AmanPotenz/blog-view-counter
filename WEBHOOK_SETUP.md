# Webflow Webhook Setup Guide

Complete guide to setting up secure automatic sync when you publish new blogs.

---

## What You Need

✅ Webflow webhook secret key: `9b47c2b3836e90d523ff372f059d2966576e7026df01048ab08ebd01e0f32914`
✅ Sync endpoint URL: `https://blog-view-counter-ten.vercel.app/api/sync-from-webflow`

---

## Step-by-Step Setup

### 1. Go to Webflow Webhooks Settings

1. Open your Webflow dashboard
2. Select your site
3. Go to **Site Settings** → **Integrations** → **Webhooks**
4. Click **"Add Webhook"** or **"Create Webhook"**

---

### 2. Configure the Webhook

Fill in these details:

**Trigger Type:**
- Select: `Collection Item Created` (when new blog is published)
- OR: `Collection Item Changed` (when blog is updated)
- Recommended: Enable **both** triggers

**Collection:**
- Select your **blog collection** from the dropdown

**Webhook URL:**
```
https://blog-view-counter-ten.vercel.app/api/sync-from-webflow
```

**Webhook Secret** (if asked):
```
9b47c2b3836e90d523ff372f059d2966576e7026df01048ab08ebd01e0f32914
```

---

### 3. Test the Webhook

After saving:

1. **Publish a test blog** in Webflow
2. **Check Webflow webhook logs** (should show success)
3. **Check Airtable** → New blog should appear with 0 views
4. **Visit the blog** → View count should increment to 1

---

## Security: How Webhook Verification Works

Your endpoint is now **protected** against unauthorized requests.

### Without Signature (Manual Calls)
```bash
curl -X POST https://blog-view-counter-ten.vercel.app/api/sync-from-webflow
# ✅ Works - syncs all blogs
```

### With Invalid Signature (Malicious Requests)
```bash
curl -X POST -H "X-Webflow-Signature: fake" https://...
# ❌ Rejected - returns 401 Unauthorized
```

### With Valid Signature (From Webflow)
```bash
# Webflow automatically sends correct signature
# ✅ Verified - syncs only the new/updated blog
```

---

## Webhook Behavior

### What Happens When Triggered

```
1. You publish a new blog in Webflow
   ↓
2. Webflow sends webhook to your endpoint
   ↓
3. Endpoint verifies signature (security check)
   ↓
4. Endpoint syncs all Webflow blogs to Airtable
   ↓
5. New blog appears in Airtable with 0 views
   ✅ Done!
```

### Response Examples

**Success:**
```json
{
  "success": true,
  "message": "Sync completed: 1 created, 0 errors",
  "created": [
    {
      "slug": "my-new-blog",
      "title": "My New Blog Post",
      "airtable_id": "recXXXXXXXXXXXXXX"
    }
  ],
  "stats": {
    "total_webflow": 24,
    "total_airtable": 24,
    "created_count": 1
  }
}
```

**Already Synced:**
```json
{
  "success": true,
  "message": "All Webflow blogs already exist in Airtable",
  "synced": 0
}
```

---

## Troubleshooting

### Webhook Not Firing

**Check Webflow Settings:**
- Is the webhook enabled?
- Is the correct collection selected?
- Is the URL exactly right (no typos)?

**Check Webflow Webhook Logs:**
- Go to Webhooks settings
- Look for recent triggers
- Check for error messages

---

### Webhook Firing But Failing

**Check Response Logs in Webflow:**
- Status code should be `200`
- If `401`: Signature verification failed
- If `500`: Server error (check Vercel logs)

**Check Vercel Logs:**
```bash
vercel logs blog-view-counter-ten.vercel.app
```

Look for:
- `[SYNC] ✅ Webhook signature verified` - Good!
- `[SYNC] Invalid webhook signature` - Secret key mismatch
- `[SYNC] Error:` - See the error message

---

### Signature Verification Failing

**Possible causes:**
1. **Wrong secret in .env** - Check it matches Webflow exactly
2. **Secret not deployed** - Run `vercel --prod` to update
3. **Webflow changed the secret** - Get new one from Webflow

**Fix:**
```bash
# Update .env with correct secret
# Then redeploy
vercel --prod
```

---

### Blog Not Appearing in Airtable

**Check these:**

1. **Does the blog have a slug?**
   - In Webflow CMS, check the slug field is filled
   - Blogs without slugs are skipped

2. **Is it already in Airtable?**
   - Endpoint skips existing blogs
   - Check Airtable for the slug

3. **Check the response:**
   - Look at `created` array
   - Look at `errors` array for issues

---

## Environment Variables

Make sure these are set in Vercel:

```bash
WEBFLOW_WEBHOOK_SECRET=9b47c2b3836e90d523ff372f059d2966576e7026df01048ab08ebd01e0f32914
WEBFLOW_API_TOKEN=<your-token>
WEBFLOW_COLLECTION_ID=6901e61a8b55eb47eac132cd
AIRTABLE_API_KEY=<your-key>
AIRTABLE_BASE_ID=appBHMwqW7c9rG5Uv
AIRTABLE_TABLE_NAME=Blog Posts
```

**To set in Vercel:**
1. Go to Vercel dashboard
2. Select your project
3. Settings → Environment Variables
4. Add `WEBFLOW_WEBHOOK_SECRET`
5. Redeploy: `vercel --prod`

---

## Manual Sync (Backup Method)

If webhooks aren't working, you can still sync manually:

**PowerShell:**
```powershell
./test-sync-from-webflow.ps1
```

**Curl:**
```bash
curl -X POST https://blog-view-counter-ten.vercel.app/api/sync-from-webflow
```

---

## Best Practices

### 1. Test Before Going Live
- Create a test blog
- Publish it
- Verify it appears in Airtable
- Delete the test blog

### 2. Monitor Initially
- Check Webflow webhook logs after each publish
- Verify Airtable gets updated
- Watch for any errors

### 3. Set Up Alerts
- Configure Webflow to email you on webhook failures
- Check logs weekly

### 4. Backup Sync
- Set up a scheduled cron job (every 6 hours)
- Catches any missed webhooks
- Ensures data consistency

---

## Success Checklist

- [ ] Webhook created in Webflow
- [ ] Correct trigger selected (collection_item_created)
- [ ] Correct collection selected (blog collection)
- [ ] Webhook URL entered correctly
- [ ] Webhook secret configured (if available)
- [ ] Environment variable set in Vercel
- [ ] Deployed to production (`vercel --prod`)
- [ ] Test blog published successfully
- [ ] Test blog appears in Airtable
- [ ] View count increments when visited

---

## Need Help?

**Check Logs:**
```bash
# Vercel logs
vercel logs blog-view-counter-ten.vercel.app

# Webflow webhook logs
# Go to: Site Settings → Integrations → Webhooks → View Logs
```

**Common Issues:**
- 401 Error: Signature verification failed (check secret)
- 404 Error: Wrong URL (check endpoint path)
- 500 Error: Server error (check Vercel logs)
- No trigger: Webhook not configured correctly

---

Your webhook is now **secure and automated**! 🎉

Every time you publish a blog in Webflow, it automatically appears in Airtable with 0 views, ready to track!
