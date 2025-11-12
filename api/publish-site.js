module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get site ID from environment variable
    const siteId = process.env.WEBFLOW_SITE_ID;

    if (!siteId) {
      return res.status(500).json({
        error: 'WEBFLOW_SITE_ID environment variable not set'
      });
    }

    // Publish the site
    const publishResponse = await fetch(
      `https://api.webflow.com/v2/sites/${siteId}/publish`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WEBFLOW_API_TOKEN}`,
          'accept': 'application/json',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          publishToWebflowSubdomain: true
        })
      }
    );

    if (!publishResponse.ok) {
      const errorData = await publishResponse.json();
      return res.status(500).json({
        error: 'Failed to publish site',
        details: errorData
      });
    }

    const publishData = await publishResponse.json();

    return res.status(200).json({
      success: true,
      message: 'Site published successfully',
      siteId: siteId,
      data: publishData
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Failed to publish site',
      details: error.message
    });
  }
};
