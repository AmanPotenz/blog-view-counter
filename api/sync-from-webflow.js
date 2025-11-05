const Airtable = require('airtable');
const crypto = require('crypto');

// SERVER-SIDE DEDUPLICATION: Prevent duplicate syncs
const pendingSync = { promise: null, timestamp: 0 };

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Webflow-Signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ============================================
  // Webhook Security: TEMPORARILY DISABLED FOR DEBUGGING
  // ============================================
  const webhookSignature = req.headers['x-webflow-signature'];

  if (webhookSignature) {
    console.log('[SYNC] ⚠️ Webhook signature present but verification TEMPORARILY DISABLED');
    console.log('[SYNC] Signature received:', webhookSignature);
    console.log('[SYNC] Headers:', JSON.stringify(req.headers));
  } else {
    console.log('[SYNC] No webhook signature present (manual call)');
  }

  // TODO: Re-enable signature verification after debugging
  // Keeping this commented for now
  /*
  const webhookSecrets = [
    process.env.WEBFLOW_WEBHOOK_SECRET_PUBLISH,
    process.env.WEBFLOW_WEBHOOK_SECRET_CREATE,
    process.env.WEBFLOW_WEBHOOK_SECRET
  ].filter(Boolean);

  if (webhookSignature && webhookSecrets.length > 0) {
    // ... verification code ...
  }
  */

  // ============================================
  // DEDUPLICATION: Check if sync is already running
  // ============================================
  const now = Date.now();
  const DEBOUNCE_TIME = 5000; // 5 seconds

  // If a sync started within last 5 seconds, reuse it
  if (pendingSync.promise && (now - pendingSync.timestamp) < DEBOUNCE_TIME) {
    console.log('[SYNC] ⏳ Sync already in progress, reusing existing request');
    try {
      const result = await pendingSync.promise;
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Sync failed',
        details: error.message
      });
    }
  }

  // Create new sync promise
  const syncPromise = (async () => {
    try {
      console.log('[SYNC] Starting Webflow to Airtable sync...');

      // Log webhook trigger info if available
      if (req.body && req.body.triggerType) {
        console.log(`[SYNC] Triggered by: ${req.body.triggerType}`);
      }

    // ============================================
    // Step 1: Fetch all items from Webflow CMS
    // ============================================
    const webflowResponse = await fetch(
      `https://api.webflow.com/v2/collections/${process.env.WEBFLOW_COLLECTION_ID}/items`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.WEBFLOW_API_TOKEN}`,
          'accept': 'application/json'
        }
      }
    );

    if (!webflowResponse.ok) {
      const errorData = await webflowResponse.json();
      throw new Error(`Webflow API error: ${JSON.stringify(errorData)}`);
    }

    const webflowData = await webflowResponse.json();
    const webflowItems = webflowData.items || [];

    console.log(`[SYNC] Found ${webflowItems.length} items in Webflow CMS`);

    // Extract blog data from Webflow
    const webflowBlogs = webflowItems
      .map(item => ({
        slug: item.fieldData?.slug || item.slug,
        title: item.fieldData?.name || item.name,
        webflow_id: item.id
      }))
      .filter(blog => blog.slug); // Only include items with slugs

    // ============================================
    // Step 2: Fetch all records from Airtable
    // ============================================
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    const airtableRecords = await base(process.env.AIRTABLE_TABLE_NAME)
      .select()
      .all();

    console.log(`[SYNC] Found ${airtableRecords.length} records in Airtable`);

    // Create a Set of existing slugs in Airtable for fast lookup
    const airtableSlugs = new Set(
      airtableRecords.map(record => record.get('slug')).filter(Boolean)
    );

    // ============================================
    // Step 3: Find missing blogs in Airtable
    // ============================================
    const missingBlogs = webflowBlogs.filter(blog => {
      return blog.slug && !airtableSlugs.has(blog.slug);
    });

    console.log(`[SYNC] Found ${missingBlogs.length} blogs missing in Airtable`);

    if (missingBlogs.length === 0) {
      return {
        success: true,
        message: 'All Webflow blogs already exist in Airtable',
        synced: 0,
        total_webflow: webflowItems.length,
        total_airtable: airtableRecords.length
      };
    }

    // ============================================
    // Step 4: Create missing blogs in Airtable
    // ============================================
    const created = [];
    const errors = [];

    // Airtable allows batch creates up to 10 records at a time
    const batchSize = 10;

    for (let i = 0; i < missingBlogs.length; i += batchSize) {
      const batch = missingBlogs.slice(i, i + batchSize);

      try {
        console.log(`[SYNC] Creating batch ${Math.floor(i / batchSize) + 1}: ${batch.length} records`);

        const recordsToCreate = batch.map(blog => ({
          fields: {
            slug: blog.slug,
            title: blog.title,
            view_count: 0,      // Initialize with 0 views
            old_views: 0        // Initialize with 0 old views
          }
        }));

        const createdRecords = await base(process.env.AIRTABLE_TABLE_NAME).create(recordsToCreate);

        createdRecords.forEach((record, index) => {
          created.push({
            slug: batch[index].slug,
            title: batch[index].title,
            airtable_id: record.id,
            webflow_id: batch[index].webflow_id
          });
          console.log(`[SYNC] ✅ Created: ${batch[index].slug}`);
        });

        // Rate limiting: Wait 200ms between batches to avoid hitting Airtable limits
        if (i + batchSize < missingBlogs.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }

      } catch (error) {
        console.error(`[SYNC] Error creating batch:`, error);
        batch.forEach(blog => {
          errors.push({
            slug: blog.slug,
            error: error.message
          });
        });
      }
    }

    return {
      success: true,
      message: `Sync completed: ${created.length} created, ${errors.length} errors`,
      created: created,
      errors: errors,
      stats: {
        total_webflow: webflowItems.length,
        total_airtable: airtableRecords.length,
        missing_blogs: missingBlogs.length,
        created_count: created.length,
        error_count: errors.length
      }
    };

    } catch (error) {
      console.error('[SYNC] Fatal error:', error);
      throw error;
    } finally {
      // Clear pending sync after completion
      setTimeout(() => {
        if (pendingSync.timestamp === now) {
          pendingSync.promise = null;
        }
      }, DEBOUNCE_TIME);
    }
  })();

  // Store the sync promise
  pendingSync.promise = syncPromise;
  pendingSync.timestamp = now;

  // Wait for sync to complete and return result
  try {
    const result = await syncPromise;
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Sync failed',
      details: error.message
    });
  }
};
