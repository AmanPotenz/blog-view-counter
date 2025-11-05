const Airtable = require('airtable');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { slug } = req.query;

  if (!slug) {
    return res.status(400).json({ error: 'Slug is required' });
  }

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    const records = await base(process.env.AIRTABLE_TABLE_NAME)
      .select({
        filterByFormula: `{slug} = '${slug}'`,
        maxRecords: 1
      })
      .firstPage();

    if (records.length === 0) {
      return res.status(404).json({
        error: 'Blog post not found',
        view_count: 0
      });
    }

    const record = records[0];
    const viewCount = record.get('view_count') || 0;
    const totalViews = record.get('total_views') || viewCount; // Fallback to view_count if total_views doesn't exist
    const title = record.get('title') || '';

    return res.status(200).json({
      slug: slug,
      view_count: viewCount,
      total_views: totalViews,
      title: title,
      record_id: record.id
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch view count',
      details: error.message
    });
  }
};
