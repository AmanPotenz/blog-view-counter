const Airtable = require('airtable');
const crypto = require('crypto');

// SERVER-SIDE DEDUPLICATION: Prevent duplicate syncs
// Using a lock mechanism to prevent race conditions
const syncLock = {
  locked: false,
  promise: null,
  timestamp: 0,
  waiters: []
};

// Helper to get raw body for signature verification
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

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
  // Webhook Security: Verify signature using RAW body
  // ============================================
  const webhookSignature = req.headers['x-webflow-signature'];

  // Get raw body BEFORE parsing (this is the exact bytes Webflow signed)
  const rawBody = await getRawBody(req);

  // Parse body for our use
  let parsedBody;
  try {
    parsedBody = rawBody ? JSON.parse(rawBody) : {};
  } catch (e) {
    parsedBody = {};
  }

  // Attach parsed body to req for later use
  req.body = parsedBody;

  if (webhookSignature) {
    console.log('[SYNC] 🔐 Verifying webhook signature...');
    console.log('[SYNC DEBUG] Raw body:', rawBody);
    console.log('[SYNC DEBUG] Raw body length:', rawBody ? rawBody.length : 0);
    console.log('[SYNC DEBUG] Secret (first 10 chars):', process.env.WEBFLOW_WEBHOOK_SECRET_PUBLISH?.substring(0, 10));
    console.log('[SYNC DEBUG] Secret length:', process.env.WEBFLOW_WEBHOOK_SECRET_PUBLISH?.length);

    // Calculate expected signature using RAW body (exactly what Webflow signed)
    const expectedSignature = crypto
      .createHmac('sha256', process.env.WEBFLOW_WEBHOOK_SECRET_PUBLISH)
      .update(rawBody) // Sign the RAW body, not parsed JSON
      .digest('hex');

    console.log('[SYNC] Expected signature:', expectedSignature);
    console.log('[SYNC] Received signature:', webhookSignature);

    if (expectedSignature !== webhookSignature) {
      console.log('[SYNC] ❌ Invalid webhook signature');
      return res.status(401).json({
        error: 'Invalid webhook signature',
        hint: 'Make sure WEBFLOW_WEBHOOK_SECRET_PUBLISH matches your webhook secret in Webflow',
        debug: {
          received: webhookSignature,
          expected: expectedSignature,
          rawBodyLength: rawBody?.length,
          rawBodySample: rawBody?.substring(0, 100)
        }
      });
    }

    console.log('[SYNC] ✅ Webhook signature verified!');
  } else {
    console.log('[SYNC] No webhook signature (manual call or testing)');
  }

  // ============================================
  // DEDUPLICATION: Acquire lock to prevent race conditions
  // ============================================
  const now = Date.now();
  const DEBOUNCE_TIME = 5000; // 5 seconds

  // Check if there's a recent sync we can reuse
  if (syncLock.locked && syncLock.promise && (now - syncLock.timestamp) < DEBOUNCE_TIME) {
    console.log('[SYNC] ⏳ Sync already in progress (locked), reusing existing request');
    try {
      const result = await syncLock.promise;
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Sync failed',
        details: error.message
      });
    }
  }

  // Acquire lock
  if (syncLock.locked) {
    console.log('[SYNC] ⚠️ Lock already acquired by another request, waiting...');
    // Wait a bit and retry
    await new Promise(resolve => setTimeout(resolve, 100));
    if (syncLock.promise) {
      try {
        const result = await syncLock.promise;
        return res.status(200).json(result);
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: 'Sync failed',
          details: error.message
        });
      }
    }
  }

  // Lock acquired
  syncLock.locked = true;
  syncLock.timestamp = now;
  console.log('[SYNC] 🔒 Lock acquired, starting sync...');

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
      // Release lock and clear sync after debounce time
      setTimeout(() => {
        if (syncLock.timestamp === now) {
          syncLock.locked = false;
          syncLock.promise = null;
          console.log('[SYNC] 🔓 Lock released');
        }
      }, DEBOUNCE_TIME);
    }
  })();

  // Store the sync promise
  syncLock.promise = syncPromise;

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

// CRITICAL: Disable Vercel's automatic body parsing
// We need access to the raw request body to verify webhook signatures
// Without this, Vercel will parse the body before we can read the raw bytes
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
