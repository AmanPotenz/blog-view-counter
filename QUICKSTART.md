# Quick Start Guide

## Step 1: Start the Local Development Server

Open a terminal in this directory and run:

```powershell
vercel dev
```

**Keep this terminal open!** The server needs to stay running.

You should see output like:
```
Vercel CLI 33.x.x
> Ready! Available at http://localhost:3000
```

## Step 2: Test the API

Open a **NEW** terminal (keep the first one running) and run:

```powershell
.\test-api.ps1
```

This will:
1. Get all view counts (should be empty at first)
2. Create a test blog post with 1 view (auto-create!)
3. Get the view count for that post
4. Increment the view count again
5. Show all view counts

### Manual Testing (PowerShell)

If you prefer to test manually:

**Get all counts:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/get-all-counts" -Method Get
```

**Increment count (auto-creates if doesn't exist):**
```powershell
$body = @{ slug = "my-blog-post" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/increment-count" -Method Post -Body $body -ContentType "application/json"
```

**Get specific count:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/get-count?slug=my-blog-post" -Method Get
```

## Step 3: Check Airtable

After testing, go to your Airtable base and you should see:
- A new record with `slug: "test-blog-post"`
- The `view_count` field should be `2` (incremented twice)
- The `last_updated` field should show the current timestamp

## Step 4: Deploy to Vercel

Once local testing works, deploy to production:

```powershell
# Add environment variables to Vercel
vercel env add AIRTABLE_API_KEY
vercel env add AIRTABLE_BASE_ID
vercel env add AIRTABLE_TABLE_NAME

# Deploy to production
vercel --prod
```

You'll get a production URL like: `https://blog-view-counter-xxx.vercel.app`

## Troubleshooting

### "Cannot find module 'airtable'"

Run:
```powershell
npm install
```

### "Authentication failed"

Check your `.env` file:
- Make sure `AIRTABLE_API_KEY` starts with `pat...`
- Verify `AIRTABLE_BASE_ID` starts with `app...`
- Ensure your token has the correct scopes and base access

### "404 Not Found"

Make sure `vercel dev` is running in another terminal first!

### "Table not found"

Make sure your Airtable table is named exactly: `Blog Posts`

## Next: Webflow Integration

Once deployed, update the Webflow script with your production URL!
