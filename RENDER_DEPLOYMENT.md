# Render.com Deployment Guide - WhatsApp Bridge Pro

## Quick Setup (5 minutes)

### Step 1: Prepare Your Code
1. Push your code to GitHub (public or private repo)
2. Make sure all files are committed (including `server.cjs`, `package.json`, `Dockerfile`)

### Step 2: Create Render Account
1. Go to [render.com](https://render.com)
2. Click **Sign up** → Sign up with GitHub
3. Authorize Render to access your repositories

### Step 3: Create Web Service
1. Click **New +** → **Web Service**
2. Select your `whatsapp-bridge-pro` repository
3. Fill in the details:

| Field | Value |
|-------|-------|
| **Name** | whatsapp-bridge-pro |
| **Environment** | Docker |
| **Region** | (Choose closest) |
| **Branch** | main |

4. Click **Advanced**:
   - **Auto-deploy**: Enable (redeploy on git push)
   - No environment variables needed initially

5. Click **Deploy**

### Step 4: Wait for Build & Deployment
- Build takes 2-5 minutes
- Once deployed, you'll get a URL like: `https://whatsapp-bridge-pro-xxx.onrender.com`

### Step 5: Test Your Deployment
```bash
# Check health
curl https://whatsapp-bridge-pro-xxx.onrender.com/health

# Should return: {"status":"ok","timestamp":"..."}
```

## Environment Variables (Optional)

If you need custom configuration, add in Render dashboard under **Environment**:

```env
PORT=3000
NODE_ENV=production
```

## Features After Deployment

✅ **Full Stack Running**
- Frontend: React UI at `https://your-service.onrender.com`
- Backend: API at `https://your-service.onrender.com/api/*`
- WhatsApp sessions: Stored in container `/app/sessions`

✅ **Auto-Restart**
- Health checks ensure service stays up
- Automatic redeploy on git push

⚠️ **Limitations**
- Sessions lost on redeploy (not persistent across deployments)
- Free tier: Service spins down after 15 min inactivity

## Adding Persistent Storage (Recommended)

For production, add Render Disk to keep sessions persistent:

1. In Render dashboard → Web Service → **Disks**
2. Click **Add Disk**:
   - **Disk name**: sessions
   - **Mounted at**: `/app/sessions`
   - **Size**: 1 GB (free tier)
3. **Save**

Now sessions persist across redeploys!

## Accessing Your App

- **Web UI**: `https://whatsapp-bridge-pro-xxx.onrender.com`
- **API**: `https://whatsapp-bridge-pro-xxx.onrender.com/api/keys`
- **Create Instance**: POST to `/instances`

## Troubleshooting

### Service won't start
1. Check **Logs** in Render dashboard
2. Look for error messages
3. Common issues:
   - Missing `server.cjs`
   - Wrong Node version (should be 22)
   - Port already in use

### Sessions lost after redeploy
→ Add Render Disk (see above section)

### Slow first request
→ Normal, service is warming up from sleep

### API calls failing
1. Verify frontend is using correct API URL
2. Check CORS is enabled in `server.cjs` (it is)
3. Use full domain: `https://whatsapp-bridge-pro-xxx.onrender.com`

## Production Checklist

- [ ] Code pushed to GitHub
- [ ] `Dockerfile` is present
- [ ] `package.json` has `"start": "node server.cjs"`
- [ ] Health endpoint working (`/health`)
- [ ] Render Disk added for `/app/sessions`
- [ ] Environment variables set (if needed)
- [ ] Auto-deploy enabled
- [ ] Tested `/health` endpoint

## Upgrade Path

**Free Tier → Paid**
If you outgrow free tier:
- Upgrade to Pro ($7/month)
- Removes inactivity spin-down
- Better performance
- Same easy deployment

## Support

- **Render Docs**: https://render.com/docs
- **WhatsApp Bridge Issues**: Check logs in Render dashboard
- **Deployment Logs**: Real-time viewing available

---

**Your app is now live! 🎉**

Once deployed, share the URL with users and start bridging WhatsApp messages!
