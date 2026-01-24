# Resilient Tracking System

This enhanced tracking system provides **multiple fallback methods** to ensure visitor tracking works even when JavaScript is blocked or tracker blockers are active.

## How It Works

### Primary Method: Client-Side Tracking (Detailed Data)
- **Endpoint**: `/api/track`
- **Method**: POST with JSON payload
- **Data**: Full visitor details (browser, device, scroll depth, time on page, etc.)
- **Vulnerability**: Can be blocked by tracker blockers or disabled JavaScript

### Fallback Method 1: Image Pixel Tracking
- **Endpoint**: `/api/log`
- **Method**: GET request via `<img>` tag
- **Why it works**: Image requests are harder to block than fetch/XHR
- **Data**: Basic info (IP, path, referrer, user-agent from headers)
- **Vulnerability**: Still can be blocked by aggressive blockers

### Fallback Method 2: Server-Side Logging
- **Endpoint**: `/api/log`
- **Method**: GET request via fetch with `no-cors` mode
- **Why it works**: `no-cors` mode bypasses some CORS restrictions
- **Data**: Basic info (IP, path, referrer, user-agent from headers)
- **Vulnerability**: Can still be blocked, but more resilient

## What Gets Tracked

### With JavaScript Enabled (Primary Method)
✅ Full visitor details:
- IP address
- Browser & OS
- Device type
- Screen/viewport dimensions
- Scroll depth
- Time on page
- Session ID
- Visitor ID (new vs returning)
- Traffic source
- Geolocation (from Vercel headers)

### With JavaScript Blocked (Fallback Methods)
✅ Basic visitor info:
- IP address
- Path visited
- Referrer
- User-Agent (parsed for browser/OS/device)
- Geolocation (from Vercel headers)
- Timestamp

## Deployment

1. **Deploy the new `/api/log.js` endpoint** to your Vercel project
2. **Redeploy your website** to get the updated `VisitorTracker.astro` component
3. **Test** by:
   - Visiting your site normally (should use primary method)
   - Disabling JavaScript (should use fallback methods)
   - Using a tracker blocker (may still block, but more resilient)

## How to Test

### Test Primary Tracking
1. Open browser DevTools → Network tab
2. Visit your site
3. Look for POST request to `/api/track`
4. Should see detailed JSON payload

### Test Fallback Tracking
1. Disable JavaScript in browser settings
2. Visit your site
3. Look for GET request to `/api/log` (image pixel)
4. Should see basic tracking data

### Test with Tracker Blocker
1. Install uBlock Origin or similar
2. Visit your site
3. Check if requests are blocked
4. Even if primary is blocked, fallback may still work

## Limitations

⚠️ **No tracking method is 100% foolproof:**
- Aggressive tracker blockers can block all methods
- Privacy-focused browsers (Brave, Firefox with strict settings) may block everything
- Users can disable JavaScript entirely
- VPNs/proxies can mask IP addresses

✅ **But this system maximizes tracking coverage:**
- Primary method for most users (detailed data)
- Fallback methods for users with blockers
- Server-side logging as last resort

## Data Storage

- **Primary tracking**: Stored in `visits` Redis list
- **Server-side logs**: Stored in `server_logs` Redis list
- **Both are merged** in the `/api/stats` endpoint for comprehensive analytics

## Privacy Considerations

This system respects user privacy:
- No cookies (uses localStorage only)
- No third-party trackers
- IP addresses are used for geolocation only
- All data stored on your own infrastructure
- Users can still block tracking if they choose
