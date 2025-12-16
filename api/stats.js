// Vercel Serverless Function for getting statistics
// Deploy this to Vercel
// Uses Upstash Redis (compatible with @vercel/kv)

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Enable CORS - allow all origins
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all visits - handle empty case
    const visits = await kv.lrange('visits', 0, -1) || [];
    const uniqueIPs = await kv.smembers('unique_ips') || [];
    const uniqueVisitors = await kv.smembers('unique_visitors') || [];

    // Parse visit data - handle empty array
    const visitData = visits.length > 0 
      ? visits.map(v => {
          try {
            return typeof v === 'string' ? JSON.parse(v) : v;
          } catch (e) {
            console.warn('Failed to parse visit:', v, e);
            return null;
          }
        }).filter(v => v !== null)
      : [];

    // Count page views per path
    const pageCounts = {};
    visitData.forEach(visit => {
      if (visit && visit.path) {
        pageCounts[visit.path] = (pageCounts[visit.path] || 0) + 1;
      }
    });

    // Get top pages
    const topPages = Object.entries(pageCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get recent visitors (last 20)
    const recentVisitors = visitData
      .slice(-20)
      .reverse()
      .filter(v => v && v.ip && v.path)
      .map(v => ({
        ip: v.ip,
        path: v.path,
        timestamp: v.timestamp || new Date().toISOString(),
      }));

    res.json({
      totalViews: visitData.length,
      distinctIPs: uniqueIPs.length,
      uniqueVisitors: uniqueVisitors.length,
      topPage: topPages[0]?.path || '/',
      topPages: topPages,
      recentVisitors: recentVisitors,
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
