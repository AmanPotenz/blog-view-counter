# Blog View Counter - Airtable + Vercel

A serverless API to track and display blog post view counts globally using Airtable as the database and Vercel for deployment.

## Features

- **Auto-Create Records**: Automatically creates Airtable records for new blog posts on first view
- **Global View Counting**: Store view counts outside of Webflow CMS
- **Session-Based Tracking**: Prevents multiple counts from the same session
- **RESTful API**: Three endpoints for getting and incrementing view counts
- **CORS Enabled**: Works seamlessly with Webflow and other frontends

## Project Structure

```
blog-view-counter/
├── api/
│   ├── get-count.js          # Get view count for a specific blog post
│   ├── increment-count.js    # Increment view count (auto-creates if needed)
│   └── get-all-counts.js     # Get all blog post view counts
├── .env                       # Environment variables (create from .env.example)
├── .env.example              # Template for environment variables
├── .gitignore                # Git ignore file
├── package.json              # Node.js dependencies
├── vercel.json               # Vercel configuration
└── README.md                 # This file
```

## Setup Instructions

### 1. Airtable Setup

1. Go to [airtable.com](https://airtable.com) and sign in
2. Create a new base called **"Blog View Counter"**
3. Create a table called **"Blog Posts"** with these fields:
   - `slug` (Single line text) - Primary field
   - `view_count` (Number) - Default value: 0
   - `last_updated` (Date)

4. Get your Airtable credentials:
   - **Personal Access Token**:
     - Go to [airtable.com/account](https://airtable.com/account)
     - Click "Generate token"
     - Name it: "Blog View Counter"
     - Add scopes: `data.records:read` and `data.records:write`
     - Add access to your base
     - Copy the token (starts with `pat...`)

   - **Base ID**:
     - Go to [airtable.com/api](https://airtable.com/api)
     - Select your base
     - Copy the Base ID (starts with `app...`)

### 2. Local Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create .env file**:
   ```bash
   cp .env.example .env
   ```

3. **Add your Airtable credentials to .env**:
   ```env
   AIRTABLE_API_KEY=your_personal_access_token_here
   AIRTABLE_BASE_ID=your_base_id_here
   AIRTABLE_TABLE_NAME=Blog Posts
   ```

4. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

5. **Run locally**:
   ```bash
   npm run dev
   ```
   or
   ```bash
   vercel dev
   ```

### 3. Testing Locally

Open a new terminal and test the endpoints:

**Get view count**:
```bash
curl "http://localhost:3000/api/get-count?slug=test-blog-post"
```

**Increment view count** (will auto-create if doesn't exist):
```bash
curl -X POST http://localhost:3000/api/increment-count -H "Content-Type: application/json" -d "{\"slug\":\"test-blog-post\"}"
```

**Get all view counts**:
```bash
curl "http://localhost:3000/api/get-all-counts"
```

### 4. Deploy to Vercel

1. **Login to Vercel**:
   ```bash
   vercel login
   ```

2. **Deploy**:
   ```bash
   npm run deploy
   ```
   or
   ```bash
   vercel --prod
   ```

3. **Add environment variables to Vercel**:

   Option A - Via CLI:
   ```bash
   vercel env add AIRTABLE_API_KEY
   vercel env add AIRTABLE_BASE_ID
   vercel env add AIRTABLE_TABLE_NAME
   ```

   Option B - Via Dashboard:
   - Go to your project on [vercel.com](https://vercel.com)
   - Navigate to **Settings** → **Environment Variables**
   - Add all three variables

4. **Redeploy** (after adding environment variables):
   ```bash
   vercel --prod
   ```

5. **Copy your production URL** (e.g., `https://blog-view-counter.vercel.app`)

## API Endpoints

### GET /api/get-count

Get the view count for a specific blog post.

**Query Parameters**:
- `slug` (required): The blog post slug

**Example**:
```bash
GET https://your-project.vercel.app/api/get-count?slug=my-blog-post
```

**Response**:
```json
{
  "slug": "my-blog-post",
  "view_count": 42,
  "record_id": "recXXXXXXXXXXXXXX",
  "last_updated": "2024-01-15T10:30:00.000Z"
}
```

### POST /api/increment-count

Increment the view count for a blog post. **Automatically creates the record if it doesn't exist.**

**Body**:
```json
{
  "slug": "my-blog-post"
}
```

**Example**:
```bash
POST https://your-project.vercel.app/api/increment-count
Content-Type: application/json

{"slug": "my-blog-post"}
```

**Response**:
```json
{
  "slug": "my-blog-post",
  "view_count": 43,
  "record_id": "recXXXXXXXXXXXXXX",
  "auto_created": false,
  "message": "View count incremented successfully"
}
```

### GET /api/get-all-counts

Get view counts for all blog posts, sorted by view count (descending).

**Example**:
```bash
GET https://your-project.vercel.app/api/get-all-counts
```

**Response**:
```json
{
  "posts": [
    {
      "slug": "popular-post",
      "view_count": 150,
      "last_updated": "2024-01-15T10:30:00.000Z"
    },
    {
      "slug": "another-post",
      "view_count": 42,
      "last_updated": "2024-01-14T08:20:00.000Z"
    }
  ],
  "total": 2
}
```

## Webflow Integration

Add this script to your Webflow site (Project Settings → Custom Code → Footer Code):

```html
<script>
(function() {
  // REPLACE WITH YOUR VERCEL URL
  const API_URL = 'https://your-project-name.vercel.app';

  function getBlogSlugFromURL() {
    const path = window.location.pathname;
    const match = path.match(/\/blog\/([^\/]+)/);
    return match ? match[1] : null;
  }

  async function incrementViewCount(slug) {
    try {
      const response = await fetch(`${API_URL}/api/increment-count`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug })
      });
      const data = await response.json();
      return data.view_count || 0;
    } catch (error) {
      console.error('Error incrementing view count:', error);
      return 0;
    }
  }

  async function getAllViewCounts() {
    try {
      const response = await fetch(`${API_URL}/api/get-all-counts`);
      const data = await response.json();
      return data.posts || [];
    } catch (error) {
      console.error('Error getting all view counts:', error);
      return [];
    }
  }

  // On individual blog pages
  if (window.location.pathname.includes('/blog/')) {
    const slug = getBlogSlugFromURL();
    if (slug) {
      const visited = sessionStorage.getItem(`blog-visited-${slug}`);
      if (!visited) {
        incrementViewCount(slug).then(newCount => {
          sessionStorage.setItem(`blog-visited-${slug}`, '1');
          console.log(`View count for ${slug}: ${newCount}`);
        });
      }
    }
  }

  // On homepage - load all view counts
  else if (window.location.pathname === '/') {
    getAllViewCounts().then(posts => {
      document.querySelectorAll('[data-blog-slug]').forEach(card => {
        const slug = card.getAttribute('data-blog-slug');
        const badge = card.querySelector('[data-read-count]');
        if (badge && slug) {
          const post = posts.find(p => p.slug === slug);
          if (post) {
            badge.textContent = `${post.view_count} reads`;
          }
        }
      });
    });
  }
})();
</script>
```

## How Auto-Create Works

The **increment-count** endpoint includes auto-create functionality:

1. When a blog post page is visited for the first time
2. The API checks Airtable: "Does this slug exist?"
3. **If NO** → Creates a new record with `view_count: 1`
4. **If YES** → Increments the existing count

This means:
- You don't need to manually add blog posts to Airtable
- New blog posts are automatically tracked on their first view
- No manual synchronization needed between Webflow and Airtable

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `AIRTABLE_API_KEY` | Your Airtable Personal Access Token | `patXXXXXXXXXXXXXX` |
| `AIRTABLE_BASE_ID` | Your Airtable Base ID | `appXXXXXXXXXXXXXX` |
| `AIRTABLE_TABLE_NAME` | Your Airtable table name | `Blog Posts` |

## Troubleshooting

### "Authentication failed" error
- Check that your `AIRTABLE_API_KEY` is correct
- Ensure the token has `data.records:read` and `data.records:write` scopes
- Verify the token has access to your base

### "Base not found" error
- Double-check your `AIRTABLE_BASE_ID`
- Ensure it starts with `app...`

### Records not being created
- Check Vercel logs: `vercel logs`
- Verify your table name matches `AIRTABLE_TABLE_NAME`
- Ensure the `slug` field exists in your Airtable table

## License

MIT
