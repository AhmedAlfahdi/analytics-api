// Vercel Serverless Function for tracking page views
// Deploy this to Vercel by creating a 'vercel-api' directory and deploying it
// Uses Upstash Redis (compatible with @vercel/kv)

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Enable CORS - allow all origins
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

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

    // Extract basic geo information from Vercel Edge headers (if available)
    // See: https://vercel.com/docs/concepts/edge-network/headers#geolocation
    const countryCode = req.headers['x-vercel-ip-country'] || null;
    const regionCode = req.headers['x-vercel-ip-country-region'] || null;
    const city = req.headers['x-vercel-ip-city'] || null;
    const latitudeHeader = req.headers['x-vercel-ip-latitude'];
    const longitudeHeader = req.headers['x-vercel-ip-longitude'];

    const latitude = typeof latitudeHeader === 'string' ? parseFloat(latitudeHeader) : null;
    const longitude = typeof longitudeHeader === 'string' ? parseFloat(longitudeHeader) : null;

    // Normalize into user-friendly fields while still keeping raw codes
    const geo = {
      countryCode,
      regionCode,
      city,
      latitude: Number.isFinite(latitude) ? latitude : null,
      longitude: Number.isFinite(longitude) ? longitude : null,
    };

    const visitData = {
      ...req.body,
      ip: ip,
      timestamp: new Date().toISOString(),
      ...geo,
    };

    // Store visit in a list (keeps last 10,000 visits)
    await kv.lpush('visits', JSON.stringify(visitData));
    await kv.ltrim('visits', 0, 9999); // Keep only last 10,000

    // Track unique IPs in a set (network-level identification)
    await kv.sadd('unique_ips', ip);

    // Track unique visitors by visitorId (browser-level identification)
    // This is more accurate than IP because:
    // - Multiple people behind same IP (NAT, corporate) = multiple visitors, one IP
    // - Same person on different networks = one visitor, multiple IPs
    if (req.body.visitorId) {
      await kv.sadd('unique_visitors', req.body.visitorId);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error tracking visit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
