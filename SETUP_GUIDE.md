# Blog View Counter - CSV Integration Setup Guide

## 🎯 What Changed

Your blog view counter now supports:
- **CSV Data Import**: Historical blog data from CSV imported to Airtable
- **Total Views Display**: Shows `old_views + view_count` = `total_views`
- **Webflow CMS Sync**: Automatically creates Webflow blog posts from Airtable data

---

## 📊 New Airtable Schema

Your Airtable now has these fields:

| Field Name | Type | Description |
|------------|------|-------------|
| `slug` | Text | Blog post URL slug (unique identifier) |
| `title` | Text | Blog post title |
| `view_count` | Number | New views after CSV import |
| `old_views` | Number | Historical views from CSV |
| `total_views` | Formula | `old_views + view_count` |
| `last_updated` | Date | Last update timestamp |

---

## 🔧 Required Webflow CMS Fields

You need to create these custom fields in your Webflow Blog Posts collection:

### How to Create Fields in Webflow:
1. Go to your Webflow dashboard
2. Navigate to CMS → Collections → Blog Posts
3. Click "Add New Field" for each field below:

### Fields to Create:

1. **Name** (Plain Text)
   - This is the default title field (already exists)
   - Maps to: Airtable `title`

2. **Slug** (Plain Text)
   - Field name: `slug`
   - Used for: URL generation
   - Maps to: Airtable `slug`

3. **Total Views** (Number)
   - Field name: `total-views` (or `total_views`)
   - Used for: Displaying view count on blog posts
   - Maps to: Airtable `total_views`

4. **Old Views** (Number) - Optional
   - Field name: `old-views` (or `old_views`)
   - Used for: Storing historical views from CSV
   - Maps to: Airtable `old_views`

---

## 🚀 Step-by-Step Setup

### Step 1: Create Webflow CMS Fields
Follow the instructions above to create the required fields.

### Step 2: Deploy to Vercel
```bash
npm run deploy
```

Or push to your Git repo if connected to Vercel.

### Step 3: Check Your Webflow Collection Schema
Call this endpoint to verify your Webflow collection structure:

```bash
GET https://your-vercel-url.vercel.app/api/check-webflow-schema
```

This will return all available fields in your Webflow collection.

### Step 4: Sync Airtable Data to Webflow
Run the sync endpoint to create missing blog posts in Webflow:

```bash
POST https://your-vercel-url.vercel.app/api/sync-to-webflow
```

**What this does:**
1. Fetches all records from Airtable
2. Fetches all items from Webflow CMS
3. Compares slugs to find missing blogs
4. Creates new Webflow CMS items for blogs that only exist in Airtable
5. Populates them with title, slug, total_views, and old_views

**Response Example:**
```json
{
  "success": true,
  "message": "Sync completed: 15 created, 0 errors",
  "created": [
    {
      "slug": "my-old-blog-post",
      "title": "My Old Blog Post",
      "webflow_id": "abc123..."
    }
  ],
  "stats": {
    "total_airtable": 50,
    "total_webflow": 35,
    "missing_blogs": 15,
    "created_count": 15,
    "error_count": 0
  }
}
```

---

## 📡 Updated API Endpoints

### 1. **GET /api/get-count**
Get view count for a specific blog.

**Request:**
```bash
GET /api/get-count?slug=my-blog-post
```

**Response:**
```json
{
  "slug": "my-blog-post",
  "view_count": 25,
  "total_views": 125,
  "title": "My Blog Post",
  "record_id": "recXXX"
}
```

---

### 2. **GET /api/get-all-counts**
Get view counts for all blogs (sorted by total_views).

**Request:**
```bash
GET /api/get-all-counts
```

**Response:**
```json
{
  "posts": [
    {
      "slug": "popular-post",
      "view_count": 50,
      "total_views": 550,
      "title": "Popular Post",
      "old_views": 500
    }
  ],
  "total": 50
}
```

---

### 3. **POST /api/increment-count**
Increment view count for a blog post.

**Request:**
```bash
POST /api/increment-count
Content-Type: application/json

{
  "slug": "my-blog-post"
}
```

**Response:**
```json
{
  "slug": "my-blog-post",
  "view_count": 26,
  "total_views": 126,
  "record_id": "recXXX",
  "auto_created": false,
  "message": "View count incremented successfully"
}
```

**New Behavior:**
- If blog doesn't exist in Airtable, it creates a new record with:
  - `view_count: 1`
  - `old_views: 0` (new blogs from Webflow)
  - `total_views: 1`

---

### 4. **POST /api/sync-to-webflow** (NEW)
Sync Airtable blogs to Webflow CMS.

**Request:**
```bash
POST /api/sync-to-webflow
```

**What it does:**
- Finds blogs in Airtable that don't exist in Webflow
- Creates new CMS items in Webflow with the data
- Populates title, slug, total_views, old_views

---

### 5. **GET /api/check-webflow-schema** (NEW)
Check your Webflow collection structure.

**Request:**
```bash
GET /api/check-webflow-schema
```

**Response:**
```json
{
  "collection_name": "Blog Posts",
  "collection_id": "6901e61a8b55eb47eac132cd",
  "fields": [
    { "slug": "name", "displayName": "Name", "type": "PlainText" },
    { "slug": "slug", "displayName": "Slug", "type": "PlainText" },
    { "slug": "total-views", "displayName": "Total Views", "type": "Number" }
  ]
}
```

---

## 🎨 Frontend Changes (Webflow Script)

The `webflow-script.html` now displays **total_views** instead of just `view_count`.

**On Blog Post Pages:**
```html
<div data-view-count>0</div>
<!-- Will show total_views (old_views + view_count) -->
```

**On Homepage:**
```html
<div data-blog-slug="my-blog-post">
  <div data-read-count>0 reads</div>
  <!-- Will show total_views -->
</div>
```

---

## 🔄 Complete Workflow

### For CSV Blogs (Already in Airtable):
1. CSV data imported to Airtable with:
   - `slug`, `title`, `old_views`
2. Run `/api/sync-to-webflow` to create these blogs in Webflow CMS
3. When users visit these blogs:
   - `view_count` increments (new views)
   - `total_views` = `old_views + view_count` (calculated by Airtable formula)
   - Frontend displays `total_views`

### For New Blogs (Created in Webflow):
1. New blog created in Webflow CMS
2. When first user visits:
   - Auto-creates Airtable record with:
     - `view_count: 1`
     - `old_views: 0`
     - `total_views: 1`
3. Subsequent visits increment `view_count`
4. `total_views` stays accurate (0 + new views)

---

## 🧪 Testing

### 1. Test API Endpoints
```bash
# Check Webflow schema
curl https://your-vercel-url.vercel.app/api/check-webflow-schema

# Sync to Webflow
curl -X POST https://your-vercel-url.vercel.app/api/sync-to-webflow

# Get all counts
curl https://your-vercel-url.vercel.app/api/get-all-counts
```

### 2. Test Frontend
1. Visit a blog post with CSV data → Should show total_views (old + new)
2. Visit a new blog post → Should show 1 view, then increment
3. Visit homepage → Should show total_views for all blogs

---

## 📝 Important Notes

1. **Airtable Formula**: Make sure `total_views` is a **Formula field** with:
   ```
   {old_views} + {view_count}
   ```

2. **Webflow Field Names**: The sync endpoint uses:
   - `name` → Blog title
   - `slug` → URL slug
   - `total-views` → Total view count
   - `old-views` → Historical views

   Adjust the field names in `api/sync-to-webflow.js` if your Webflow fields have different names.

3. **Rate Limiting**: The sync endpoint waits 200ms between each blog creation to avoid hitting Webflow API limits.

4. **Publishing**: The sync endpoint does NOT auto-publish your site. You need to manually publish in Webflow after sync, or uncomment the auto-publish code in `sync-to-webflow.js`.

---

## 🐛 Troubleshooting

### Sync fails with "Field not found" error
→ Your Webflow CMS fields have different names. Run `/api/check-webflow-schema` to see actual field names, then update `sync-to-webflow.js` accordingly.

### Total views showing as 0
→ Check that your Airtable `total_views` field is a Formula field, not a Number field.

### Blogs not appearing in Webflow
→ After running sync, you need to **publish your site** in Webflow for the new CMS items to appear on the live site.

---

## ✅ Checklist

- [ ] Create required fields in Webflow CMS
- [ ] Ensure Airtable `total_views` is a Formula field
- [ ] Deploy updated code to Vercel
- [ ] Run `/api/check-webflow-schema` to verify fields
- [ ] Run `/api/sync-to-webflow` to create missing blogs
- [ ] Publish your Webflow site
- [ ] Test frontend display of total_views
- [ ] Verify new blog auto-creation works

---

## 🎉 You're All Set!

Your blog view counter now:
- ✅ Displays total views (old + new)
- ✅ Auto-creates Webflow blogs from Airtable
- ✅ Handles CSV historical data correctly
- ✅ Works seamlessly with new and existing blogs
