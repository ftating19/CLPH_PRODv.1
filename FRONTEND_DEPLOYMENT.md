# Frontend Deployment Guide for Coolify

## DNS Configuration (Already Set)
- Main domain: `cictpeerlearninghub.com` → `72.62.70.24`
- WWW: `www.cictpeerlearninghub.com` → `cictpeerlearninghub.com`
- API: `api.cictpeerlearninghub.com` → `72.62.70.24`

## Files Created for Deployment
1. `Dockerfile` - Docker configuration for Next.js app
2. `.dockerignore` - Files to exclude from Docker build
3. `.env.production` - Production environment variables

## Coolify Deployment Steps

### 1. Push Changes to GitHub
```bash
cd /c/Development/CLPH_PRODv1/CICTHUB
git add .
git commit -m "Add Coolify deployment configuration for frontend"
git push origin main
```

### 2. Create New Resource in Coolify
1. Log in to your Coolify dashboard at `https://your-coolify-domain.com`
2. Click **"+ New Resource"**
3. Select **"Public Repository"**
4. Enter repository URL: `https://github.com/ftating19/CLPH_PRODv.1.git`
5. Select the `main` branch

### 3. Configure the Application
**General Settings:**
- **Name**: `CICT Peer Learning Hub - Frontend`
- **Build Pack**: Docker
- **Dockerfile Location**: `frontend/Dockerfile`
- **Base Directory**: `frontend`
- **Port**: `3000`

**Domains:**
- Add domain: `cictpeerlearninghub.com`
- Add domain: `www.cictpeerlearninghub.com`
- Enable **"Generate Let's Encrypt Certificate"**

**Environment Variables:**
Add the following environment variable:
- `NEXT_PUBLIC_API_URL` = `https://api.cictpeerlearninghub.com`

### 4. Build & Deploy
1. Click **"Save"**
2. Click **"Deploy"**
3. Monitor the build logs
4. Wait for deployment to complete (usually 5-10 minutes)

### 5. Verify Deployment
1. Visit `https://cictpeerlearninghub.com`
2. Check that the site loads properly
3. Verify API connections are working

## Troubleshooting

### Build Fails
- Check build logs in Coolify
- Ensure all dependencies are in `package.json`
- Verify Dockerfile syntax

### Site Not Accessible
- Verify DNS propagation (can take up to 48 hours)
- Check SSL certificate status in Coolify
- Ensure port 3000 is exposed in Docker

### API Connection Issues
- Verify `NEXT_PUBLIC_API_URL` environment variable
- Ensure backend API is deployed and accessible
- Check CORS settings on backend

## Next Steps
After frontend is deployed successfully:
1. Deploy backend API to `api.cictpeerlearninghub.com`
2. Configure database connection
3. Test end-to-end functionality
