# Webflow Integration Guide

Your API is live at: **https://blog-view-counter-ten.vercel.app**

## Step 1: Add the Script to Webflow

1. Open your Webflow project
2. Go to **Project Settings** → **Custom Code**
3. Scroll to **Footer Code**
4. Copy the entire contents of `webflow-script.html`
5. Paste it into the Footer Code section
6. Click **Save**

## Step 2: Set Up Blog Post Pages

On your **individual blog post template page**:

1. Add a text element where you want to display the view count
2. Give it the attribute: `data-view-count`
3. Set default text to: `0` (will be replaced with actual count)

Example in Webflow:
```
Text element: "0 views"
Custom Attribute: data-view-count
```

The script will automatically:
- Detect it's a blog page
- Extract the slug from the URL
- Increment the view count (once per session)
- Update the element with the real count

## Step 3: Set Up Homepage Blog Cards

On your **homepage** (where blog posts are listed):

### For Each Blog Card:

1. **Add slug attribute to the card container**:
   - Select the blog card wrapper/link
   - Add custom attribute: `data-blog-slug`
   - Value: Use Webflow's CMS binding → Set to the blog post's **slug** field
   - Example: If slug is "getting-started-web-development", the attribute should be `data-blog-slug="getting-started-web-development"`

2. **Add view count display element**:
   - Inside the card, add a text element (e.g., "0 reads")
   - Add custom attribute: `data-read-count`
   - The script will automatically update this with real counts

### Webflow CMS Binding Example:

```
Blog Card Link Block
└─ Attribute: data-blog-slug = {Blog Post Slug Field}
   └─ Blog Image
   └─ Blog Title
   └─ Blog Excerpt
   └─ View Count Text
      └─ Attribute: data-read-count
      └─ Text: "0 reads" (will be replaced)
```

## Step 4: Publish Your Site

1. Click **Publish** in Webflow
2. Visit your live site
3. Open browser console (F12) to see logs:
   - `✅ View count for "slug-name": 5`
   - `✅ View counts loaded on homepage`

## How It Works

### On Blog Pages:
1. Script detects you're on a blog page (URL contains `/blog/`)
2. Extracts the slug from URL (e.g., `/blog/my-post` → `my-post`)
3. Checks session storage: "Has this user already viewed this?"
4. **First visit**: Increments count in Airtable, saves to session
5. **Return visit (same session)**: Just displays current count
6. Updates any element with `data-view-count` attribute

### On Homepage:
1. Script detects you're on homepage (URL is `/`)
2. Fetches ALL view counts from API
3. Loops through all elements with `data-blog-slug` attribute
4. Matches slug to view count data
5. Updates the `data-read-count` element inside each card

### Auto-Create Feature:
When someone visits a NEW blog post for the first time:
- The API automatically creates an Airtable record for that slug
- Sets view_count to 1
- No manual work needed!

## Testing

### Test Individual Blog Page:
1. Visit a blog post: `https://yoursite.com/blog/your-post-slug`
2. Open browser console (F12)
3. Look for: `✅ View count for "your-post-slug": 1`
4. Check Airtable - you should see the record

### Test Homepage:
1. Visit homepage: `https://yoursite.com/`
2. Open browser console (F12)
3. Look for: `✅ View counts loaded on homepage`
4. Blog cards should show view counts

### Test Session Prevention:
1. Visit a blog post
2. Refresh the page (F5)
3. View count should NOT increment
4. Open in incognito/new session - count WILL increment

## Troubleshooting

### "View counts not showing on homepage"
- ✅ Check that blog cards have `data-blog-slug` attribute
- ✅ Check that slug values match exactly (case-sensitive)
- ✅ Check that text elements have `data-read-count` attribute
- ✅ Open console (F12) and look for errors

### "View count not incrementing on blog pages"
- ✅ Check URL format is `/blog/slug-name`
- ✅ Clear browser session storage: `sessionStorage.clear()` in console
- ✅ Try in incognito mode
- ✅ Check Vercel logs for errors

### "CORS errors"
- ✅ The API has CORS enabled (`Access-Control-Allow-Origin: *`)
- ✅ Make sure you're using the production URL, not localhost

### "Different counts in different browsers"
- ✅ This is expected! Session storage is per-browser
- ✅ The actual Airtable count is the source of truth

## URL Structure

The script expects blog URLs in this format:
```
https://yoursite.com/blog/post-slug
```

If your URLs are different (e.g., `/posts/slug` or `/articles/slug`), modify line 11:
```javascript
const match = path.match(/\/blog\/([^\/]+)/);
```

Change `/blog/` to your actual path.

## Customization

### Change "reads" to "views":
In the script, find:
```javascript
badge.textContent = `${post.view_count} reads`;
```
Change to:
```javascript
badge.textContent = `${post.view_count} views`;
```

### Show thousands separator:
```javascript
badge.textContent = `${post.view_count.toLocaleString()} reads`;
```
Result: `1,234 reads` instead of `1234 reads`

### Add icons:
```javascript
badge.textContent = `👁 ${post.view_count} reads`;
```

## Security Notes

- ✅ The API is public (anyone can call it)
- ✅ Session storage prevents abuse from same user
- ✅ Each blog page can only increment its own slug
- ✅ Environment variables are secure in Vercel
- ✅ Airtable credentials are never exposed to the client

## Next Steps

After integration:
1. Monitor your Airtable base to see view counts grow
2. Check Vercel logs for any errors: `vercel logs`
3. Consider adding view counts to your blog post design
4. Share your most-viewed posts!

---

**Your API is live at:** https://blog-view-counter-ten.vercel.app

**Need help?** Check the browser console (F12) for detailed logs!
