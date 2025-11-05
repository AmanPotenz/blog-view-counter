const Airtable = require('airtable');
const crypto = require('crypto');

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
  // Webhook Security: Verify signature if present
  // ============================================
  const webhookSignature = req.headers['x-webflow-signature'];

  // Support both webhook secrets (create and publish)
  const webhookSecrets = [
    process.env.WEBFLOW_WEBHOOK_SECRET_PUBLISH,  // Primary: CMS published
    process.env.WEBFLOW_WEBHOOK_SECRET_CREATE,   // Secondary: CMS created/changed
    process.env.WEBFLOW_WEBHOOK_SECRET            // Legacy: single secret
  ].filter(Boolean); // Remove undefined values

  if (webhookSignature && webhookSecrets.length > 0) {
    try {
      // Webflow sends signature as: timestamp.signature
      const [timestamp, signature] = webhookSignature.split('.');

      // Construct the signed payload
      const payload = JSON.stringify(req.body);
      const signedPayload = `${timestamp}.${payload}`;

      // Try to verify against all configured secrets
      let verified = false;
      for (const secret of webhookSecrets) {
        const expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(signedPayload)
          .digest('hex');

        if (signature === expectedSignature) {
          verified = true;
          console.log('[SYNC] ✅ Webhook signature verified');
          break;
        }
      }

      // If none of the secrets worked, reject
      if (!verified) {
        console.error('[SYNC] Invalid webhook signature - none of the secrets matched');
        return res.status(401).json({
          success: false,
          error: 'Invalid webhook signature',
          message: 'Webhook verification failed'
        });
      }

    } catch (error) {
      console.error('[SYNC] Error verifying webhook signature:', error);
      return res.status(401).json({
        success: false,
        error: 'Webhook verification error',
        details: error.message
      });
    }
  } else if (webhookSignature && webhookSecrets.length === 0) {
    console.warn('[SYNC] ⚠️ Webhook signature present but no secret configured');
  }

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
      return res.status(200).json({
        success: true,
        message: 'All Webflow blogs already exist in Airtable',
        synced: 0,
        total_webflow: webflowItems.length,
        total_airtable: airtableRecords.length
      });
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

    return res.status(200).json({
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
    });

  } catch (error) {
    console.error('[SYNC] Fatal error:', error);
    return res.status(500).json({
      success: false,
      error: 'Sync failed',
      details: error.message
    });
  }
};
