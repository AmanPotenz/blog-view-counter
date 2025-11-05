// Test signature calculation to match Webflow's method
const crypto = require('crypto');

// Your webhook secret from .env
const secret = 'f8e341dc6ce15c69c55e2305cd2125247760865ea8a63b37a26f76385d569270';

// Simulate Webflow's payload (exact format)
const payload = JSON.stringify({ test: "data" });

// Calculate signature the same way Webflow does
const signature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

console.log('===========================================');
console.log('Test Signature Calculation');
console.log('===========================================');
console.log('Secret:', secret);
console.log('Payload:', payload);
console.log('Calculated Signature:', signature);
console.log('===========================================');
console.log('\nTo test, run:');
console.log(`curl -X POST https://blog-view-counter-ten.vercel.app/api/sync-from-webflow \\
  -H "Content-Type: application/json" \\
  -H "X-Webflow-Signature: ${signature}" \\
  -d '${payload}'`);
