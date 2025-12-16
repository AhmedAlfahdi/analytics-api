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

    // Filter out exit events for main analytics (keep them for engagement metrics)
    const pageViews = visitData.filter(v => !v.eventType || v.eventType !== 'page_exit');
    const exitEvents = visitData.filter(v => v.eventType === 'page_exit');

    // Count page views per path
    const pageCounts = {};
    pageViews.forEach(visit => {
      if (visit && visit.path) {
        pageCounts[visit.path] = (pageCounts[visit.path] || 0) + 1;
      }
    });

    // Get top pages
    const topPages = Object.entries(pageCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Device type breakdown
    const deviceTypes = {};
    pageViews.forEach(visit => {
      if (visit && visit.deviceType) {
        deviceTypes[visit.deviceType] = (deviceTypes[visit.deviceType] || 0) + 1;
      }
    });

    // Browser breakdown
    const browsers = {};
    pageViews.forEach(visit => {
      if (visit && visit.browser) {
        browsers[visit.browser] = (browsers[visit.browser] || 0) + 1;
      }
    });

    // OS breakdown
    const operatingSystems = {};
    pageViews.forEach(visit => {
      if (visit && visit.os) {
        operatingSystems[visit.os] = (operatingSystems[visit.os] || 0) + 1;
      }
    });

    // Traffic source breakdown
    const trafficSources = {};
    const sourceTypes = {};
    pageViews.forEach(visit => {
      if (visit && visit.sourceType) {
        sourceTypes[visit.sourceType] = (sourceTypes[visit.sourceType] || 0) + 1;
      }
      if (visit && visit.source) {
        trafficSources[visit.source] = (trafficSources[visit.source] || 0) + 1;
      }
    });

    // New vs returning visitors
    let newVisitors = 0;
    let returningVisitors = 0;
    pageViews.forEach(visit => {
      if (visit && visit.isNewVisitor !== undefined) {
        if (visit.isNewVisitor) {
          newVisitors++;
        } else {
          returningVisitors++;
        }
      }
    });

    // Time patterns
    const visitsByHour = {};
    const visitsByDay = {};
    pageViews.forEach(visit => {
      if (visit && visit.hour !== undefined) {
        visitsByHour[visit.hour] = (visitsByHour[visit.hour] || 0) + 1;
      }
      if (visit && visit.dayName) {
        visitsByDay[visit.dayName] = (visitsByDay[visit.dayName] || 0) + 1;
      }
    });

    // Engagement metrics (from exit events)
    const timeOnPageValues = exitEvents
      .filter(e => e.timeOnPage && e.timeOnPage > 0)
      .map(e => e.timeOnPage);
    const scrollDepths = exitEvents
      .filter(e => e.scrollDepth !== undefined)
      .map(e => e.scrollDepth);

    const avgTimeOnPage = timeOnPageValues.length > 0
      ? Math.round(timeOnPageValues.reduce((a, b) => a + b, 0) / timeOnPageValues.length)
      : 0;
    const avgScrollDepth = scrollDepths.length > 0
      ? Math.round(scrollDepths.reduce((a, b) => a + b, 0) / scrollDepths.length)
      : 0;

    // Sessions
    const uniqueSessions = new Set(pageViews.map(v => v.sessionId).filter(Boolean));
    const pagesPerSession = {};
    pageViews.forEach(visit => {
      if (visit && visit.sessionId) {
        pagesPerSession[visit.sessionId] = (pagesPerSession[visit.sessionId] || 0) + 1;
      }
    });
    const avgPagesPerSession = Object.keys(pagesPerSession).length > 0
      ? (Object.values(pagesPerSession).reduce((a, b) => a + b, 0) / Object.keys(pagesPerSession).length).toFixed(1)
      : '0';
    
    // Bounce Rate: Percentage of sessions with only 1 page view
    const singlePageSessions = Object.values(pagesPerSession).filter(count => count === 1).length;
    const totalSessionsCount = Object.keys(pagesPerSession).length;
    const bounceRate = totalSessionsCount > 0
      ? Math.round((singlePageSessions / totalSessionsCount) * 100)
      : 0;

    // Get recent visitors (last 20)
    const recentVisitors = pageViews
      .slice(-20)
      .reverse()
      .filter(v => v && v.ip && v.path)
      .map(v => ({
        ip: v.ip,
        path: v.path,
        timestamp: v.timestamp || new Date().toISOString(),
        deviceType: v.deviceType,
        browser: v.browser,
        sourceType: v.sourceType,
        source: v.source
      }));

    res.json({
      totalViews: pageViews.length,
      distinctIPs: uniqueIPs.length,
      uniqueVisitors: uniqueVisitors.length,
      topPage: topPages[0]?.path || '/',
      topPages: topPages,
      recentVisitors: recentVisitors,
      
      // Enhanced metrics
      deviceTypes: Object.entries(deviceTypes).map(([type, count]) => ({ type, count })),
      browsers: Object.entries(browsers).map(([browser, count]) => ({ browser, count })),
      operatingSystems: Object.entries(operatingSystems).map(([os, count]) => ({ os, count })),
      trafficSources: Object.entries(trafficSources).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count),
      sourceTypes: Object.entries(sourceTypes).map(([type, count]) => ({ type, count })),
      newVisitors: newVisitors,
      returningVisitors: returningVisitors,
      visitsByHour: Object.entries(visitsByHour).map(([hour, count]) => ({ hour: parseInt(hour), count })),
      visitsByDay: Object.entries(visitsByDay).map(([day, count]) => ({ day, count })),
      avgTimeOnPage: avgTimeOnPage,
      avgScrollDepth: avgScrollDepth,
      totalSessions: uniqueSessions.size,
      avgPagesPerSession: avgPagesPerSession,
      bounceRate: bounceRate
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
