// Debug endpoint to see what Webflow sends
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('=== WEBHOOK DEBUG ===');
  console.log('Method:', req.method);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('===================');

  return res.status(200).json({
    received: true,
    method: req.method,
    headers: req.headers,
    body: req.body,
    env_secrets: {
      WEBFLOW_WEBHOOK_SECRET_PUBLISH: process.env.WEBFLOW_WEBHOOK_SECRET_PUBLISH ? 'SET' : 'NOT SET',
      WEBFLOW_WEBHOOK_SECRET_CREATE: process.env.WEBFLOW_WEBHOOK_SECRET_CREATE ? 'SET' : 'NOT SET',
      WEBFLOW_WEBHOOK_SECRET: process.env.WEBFLOW_WEBHOOK_SECRET ? 'SET' : 'NOT SET'
    }
  });
};
