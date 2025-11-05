# Webflow Webhook Setup - Simple Guide

Since Webflow only allows ONE trigger type per webhook, you need **TWO webhooks** for complete coverage.

---

## Setup: Two Webhooks

### Webhook #1: When Blog is Published ⭐ (RECOMMENDED)

**Name:** Blog Published Sync

**Trigger:**
- Select: **`Site published`** (from the dropdown)

**URL:**
```
https://blog-view-counter-ten.vercel.app/api/sync-from-webflow
```

**Webhook Secret:**
```
f8e341dc6ce15c69c55e2305cd2125247760865ea8a63b37a26f76385d569270
```

**What this does:**
- Fires when you click "Publish" in Webflow
- Syncs ALL blogs to Airtable
- Best for production use

---

### Webhook #2: When Blog is Created/Changed (OPTIONAL)

**Name:** Blog CMS Changes

**Trigger:**
- Select: **`Collection item created`** OR **`Collection item changed`**

**URL:**
```
https://blog-view-counter-ten.vercel.app/api/sync-from-webflow
```

**Webhook Secret:**
```
9b47c2b3836e90d523ff372f059d2966576e7026df01048ab08ebd01e0f32914
```

**What this does:**
- Fires when you create/edit a blog (even before publish)
- Good for draft tracking
- Optional - only if you want instant draft sync

---

## Which One Should You Use?

### For Most Users: Just Webhook #1 (Site Published)

✅ **Pros:**
- Only fires when you actually publish
- Cleaner (no draft noise)
- Reduces API calls
- **This is all you need**

❌ **Cons:**
- Only syncs on publish (not on save draft)

### For Advanced Users: Both Webhooks

Use both if you want:
- Instant sync when creating drafts
- Backup in case one webhook fails
- Real-time draft tracking

---

## Step-by-Step: Create Webhook #1 (Site Published)

1. **Open Webflow Dashboard**
   - Go to https://webflow.com/dashboard
   - Select your site

2. **Go to Webhooks**
   - Click **Settings** (gear icon)
   - Click **Integrations** tab
   - Scroll to **Webhooks** section
   - Click **"Add webhook"**

3. **Fill in the form:**

   **Trigger:**
   - Select: **`Site published`**

   **Webhook URL:**
   ```
   https://blog-view-counter-ten.vercel.app/api/sync-from-webflow
   ```

   **Webhook Secret Key:**
   ```
   f8e341dc6ce15c69c55e2305cd2125247760865ea8a63b37a26f76385d569270
   ```

4. **Save the webhook**

5. **Test it:**
   - Publish your site
   - Check webhook logs (should see status 200)
   - Check Airtable (new blogs should appear)

---

## Common Webflow Trigger Types

Here's what each trigger does:

| Trigger | When it Fires | Use For |
|---------|--------------|---------|
| **Site published** | When you click "Publish" button | ⭐ Production sync (RECOMMENDED) |
| **Collection item created** | When you create a new CMS item | Draft tracking |
| **Collection item changed** | When you edit any CMS item | Update tracking |
| **Collection item deleted** | When you delete a CMS item | Cleanup (not needed for us) |
| **Form submission** | When someone submits a form | Contact forms (not needed) |

---

## Troubleshooting

### "I don't see 'Site published' option"

Depending on your Webflow plan, trigger options vary:
- Try: **`Collection item created`** instead
- Or: **`Collection item changed`**
- Then select your Blog collection

### "Webhook fires but nothing happens"

1. **Check webhook logs in Webflow**
   - Should show status 200 (success)
   - Check response body for errors

2. **Check the secret matches**
   - Make sure you used the correct secret for the trigger type

3. **Run manual sync to confirm it works**
   ```bash
   curl -X POST https://blog-view-counter-ten.vercel.app/api/sync-from-webflow
   ```

### "I created webhook but blogs still don't appear"

Remember:
1. Webhook syncs blogs to Airtable ✅
2. **You still need to REFRESH your homepage** to see them ❌
3. The page doesn't auto-update (that's normal!)

---

## Quick Reference

### Webhook #1 Settings (RECOMMENDED)

```
Name: Blog Published Sync
Trigger: Site published
URL: https://blog-view-counter-ten.vercel.app/api/sync-from-webflow
Secret: f8e341dc6ce15c69c55e2305cd2125247760865ea8a63b37a26f76385d569270
```

### Webhook #2 Settings (OPTIONAL)

```
Name: Blog CMS Changes
Trigger: Collection item created
Collection: Blog Posts
URL: https://blog-view-counter-ten.vercel.app/api/sync-from-webflow
Secret: 9b47c2b3836e90d523ff372f059d2966576e7026df01048ab08ebd01e0f32914
```

---

## Summary

✅ Create **ONE webhook** with "Site published" trigger
✅ Use the **publish secret**: `f8e3...270`
✅ Test by publishing your site
✅ Remember to **refresh your homepage** to see new blogs

**That's it!** One webhook is all you need for automatic sync. 🎉
