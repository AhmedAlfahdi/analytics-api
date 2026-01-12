# Vercel Analytics API

This is the recommended solution for tracking website visitors. It uses Vercel Serverless Functions with Vercel KV (Redis) for data storage.

## Why Vercel?

- **Free tier**: 100GB bandwidth, 100GB KV storage, unlimited requests
- **Easy deployment**: Just connect GitHub and deploy
- **Fast**: Global CDN, serverless functions
- **No server management**: Fully managed
- **Perfect for static sites**: Works seamlessly with GitHub Pages

## Setup Instructions

### 1. Create Vercel Account

1. Go to [vercel.com](https://vercel.com) and sign up (free)
2. Connect your GitHub account

### 2. Create Vercel KV Database

1. In Vercel dashboard, go to **Storage** tab
2. Click **Create Database** → Select **KV**
3. Choose a name (e.g., `analytics-kv`)
4. Select a region closest to you
5. Click **Create**
6. Note the connection details (you'll need these)

### 3. Deploy the API

**Option A: Deploy as separate project (Recommended)**

1. Create a new repository on GitHub (e.g., `your-username/analytics-api`)
2. Copy the `analytics-api` folder contents to this repository
3. In Vercel dashboard, click **Add New Project**
4. Import your `analytics-api` repository
5. Add environment variable:
   - Name: `KV_REST_API_URL`
   - Value: (from your KV database connection)
6. Add environment variable:
   - Name: `KV_REST_API_TOKEN`
   - Value: (from your KV database connection)
7. Click **Deploy**

**Option B: Deploy in same project (if using Vercel for hosting)**

1. Add the `analytics-api/api` folder to your main website repository
2. Add environment variables in Vercel project settings
3. Deploy

### 4. Get Your API URL

After deployment, Vercel will give you a URL like:
- `https://analytics-api.vercel.app` (production)
- `https://analytics-api-xxx.vercel.app` (preview)

Your API endpoints will be:
- `https://analytics-api.vercel.app/api/track`
- `https://analytics-api.vercel.app/api/stats`

### 5. Configure Your Website

In your website's environment variables (or `.env` file for local):

```
PUBLIC_ANALYTICS_API=https://analytics-api.vercel.app/api
```

For GitHub Pages, you'll need to set this in your build process or use a different approach (see below).

## Alternative: Railway (Simple Node.js Server)

If you prefer a traditional server approach, use the `api-example` folder and deploy to Railway:

1. Go to [railway.app](https://railway.app)
2. Create new project → Deploy from GitHub
3. Select your repository
4. Railway auto-detects Node.js
5. Add environment variables if needed
6. Deploy

Railway gives you a URL like: `https://your-app.railway.app`

## Alternative: Supabase (PostgreSQL)

For a more robust database solution:

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Use the SQL schema from `ANALYTICS-SETUP.md`
4. Create API endpoints using Supabase Edge Functions or a simple Node.js server

## Cost Comparison

- **Vercel**: Free tier is very generous, perfect for personal sites
- **Railway**: $5/month after free credits, simple pricing
- **Render**: Free tier available, good for small projects
- **Supabase**: Free tier available, more features

## Recommended: Vercel

For a personal website, Vercel is the best choice:
- Easiest setup
- Free tier covers most needs
- No maintenance required
- Fast global performance

## Testing

1. Deploy your API
2. Set `PUBLIC_ANALYTICS_API` in your website
3. Visit your website pages
4. Check the statistics in the site info modal (click the "!" button)

## Troubleshooting

- **CORS errors**: The API already includes CORS headers
- **KV connection errors**: Check your environment variables
- **No data**: Make sure the tracking component is loading and API endpoint is correct

