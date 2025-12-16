// Vercel Serverless Function for tracking page views
// Deploy this to Vercel by creating a 'vercel-api' directory and deploying it
// Uses Upstash Redis (compatible with @vercel/kv)

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract IP from headers (Vercel provides this)
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
               req.headers['x-real-ip'] || 
               'unknown';

    const visitData = {
      ...req.body,
      ip: ip,
      timestamp: new Date().toISOString(),
    };

    // Store visit in a list (keeps last 10,000 visits)
    await kv.lpush('visits', JSON.stringify(visitData));
    await kv.ltrim('visits', 0, 9999); // Keep only last 10,000

    // Track unique IPs in a set
    await kv.sadd('unique_ips', ip);

    // Track unique visitors by IP+path combination (optional)
    const visitorKey = `${ip}:${visitData.path}`;
    await kv.sadd('unique_visitors', visitorKey);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error tracking visit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
