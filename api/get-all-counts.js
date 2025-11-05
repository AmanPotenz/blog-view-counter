const Airtable = require('airtable');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    const records = await base(process.env.AIRTABLE_TABLE_NAME)
      .select()
      .all();

    const counts = records.map(record => {
      const viewCount = record.get('view_count') || 0;
      const totalViews = record.get('total_views') || viewCount; // Fallback to view_count if total_views doesn't exist
      return {
        slug: record.get('slug'),
        view_count: viewCount,
        total_views: totalViews,
        title: record.get('title') || '',
        old_views: record.get('old_views') || 0
      };
    });

    // Sort by total_views descending (client-side)
    counts.sort((a, b) => b.total_views - a.total_views);

    return res.status(200).json({
      posts: counts,
      total: counts.length
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch view counts',
      details: error.message
    });
  }
};
