// Vercel Serverless Function for getting statistics
// Deploy this to Vercel
// Uses Upstash Redis (compatible with @vercel/kv)

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all visits
    const visits = await kv.lrange('visits', 0, -1);
    const uniqueIPs = await kv.smembers('unique_ips');
    const uniqueVisitors = await kv.smembers('unique_visitors');

    // Parse visit data
    const visitData = visits.map(v => JSON.parse(v));

    // Count page views per path
    const pageCounts = {};
    visitData.forEach(visit => {
      pageCounts[visit.path] = (pageCounts[visit.path] || 0) + 1;
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
      .map(v => ({
        ip: v.ip,
        path: v.path,
        timestamp: v.timestamp,
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
    res.status(500).json({ error: 'Internal server error' });
  }
}
