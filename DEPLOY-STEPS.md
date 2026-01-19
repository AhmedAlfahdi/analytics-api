# Quick Deploy Steps for Analytics API

## Step 1: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `analytics-api`
3. Description: "Analytics API for website visitor tracking"
4. Make it **Public** (required for Vercel free tier)
5. **Don't** check "Initialize with README"
6. Click **Create repository**

## Step 2: Push Code to GitHub

Open terminal in the `analytics-api` folder and run:

```bash
cd analytics-api
git init
git add .
git commit -m "Initial commit - Analytics API"
git branch -M main
git remote add origin https://github.com/AhmedAlfahdi/analytics-api.git
git push -u origin main
```

(Replace `AhmedAlfahdi` with your GitHub username if different)

## Step 3: Deploy to Vercel

1. Go to Vercel Dashboard
2. Click **Add New Project**
3. Click **Import Git Repository**
4. Find and select `AhmedAlfahdi/analytics-api`
5. Click **Import**

## Step 4: Configure Project

1. **Project Name**: `analytics-api` (or your choice)
2. **Framework Preset**: Leave as "Other" or "Vercel"
3. **Root Directory**: Leave as `./` (default)

## Step 5: Add Environment Variables

Click **Add** and add these two:

**Variable 1:**
- Name: `KV_REST_API_URL`
- Value: `https://trusted-lionfish-25758.upstash.io`

**Variable 2:**
- Name: `KV_REST_API_TOKEN`
- Value: `AWSeAAIncDE2NTE2YmYyZDM4NDE0NzdmYWIzNGNhMTE1MDVlYTczMHAxMjU3NTg`

Make sure to add for **Production**, **Preview**, and **Development** environments.

## Step 6: Deploy

Click **Deploy** and wait for it to complete (~1-2 minutes).

## Step 7: Get Your API URL

After deployment, you'll see:
- Production URL: `https://analytics-api.vercel.app` (or similar)

Your endpoints:
- `https://analytics-api.vercel.app/api/track`
- `https://analytics-api.vercel.app/api/stats`

## Step 8: Configure Your Website

Add this to your website's environment variables:

**For local development** (`.env` file):
```
PUBLIC_ANALYTICS_API=https://analytics-api.vercel.app/api
```

**For production** (GitHub Secrets):
1. Go to your main website repo → Settings → Secrets and variables → Actions
2. New repository secret:
   - Name: `PUBLIC_ANALYTICS_API`
   - Value: `https://analytics-api.vercel.app/api`

## Step 9: Test

1. Visit your website
2. Navigate to a few pages
3. Click the "!" button (site info)
4. Check "Website Statistics" section

Done!

