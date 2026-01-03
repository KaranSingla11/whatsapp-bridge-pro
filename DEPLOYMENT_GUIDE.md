# WhatsApp Bridge Pro - Deployment Guide

## Overview
This guide explains how to properly deploy the WhatsApp Bridge Pro application so that both frontend and backend work together correctly, especially when using APIs from external applications.

## Architecture Issue: localhost vs Deployed Apps

### The Problem
When you deploy your frontend application to a server (e.g., `https://myapp.com`), it **cannot** call `http://localhost:3000` because:

1. **localhost** on the deployed server refers to the deployed server itself, NOT your local machine
2. External applications (like mobile apps or other servers) cannot access your personal machine's localhost
3. You'll get CORS errors and connection failures

### Example Problem Scenario
```
❌ WRONG:
- Frontend deployed to: https://myapp.com
- Frontend tries to call: http://localhost:3000/send/text
- Result: Fails! The backend doesn't exist on the deployed server

✅ CORRECT:
- Frontend deployed to: https://myapp.com
- Backend deployed to: https://api.myapp.com (or same domain)
- Frontend calls: https://api.myapp.com/send/text
- Result: Works!
```

## Solution Options

### Option 1: Deploy Backend to Public Server (RECOMMENDED)

Deploy your Node.js backend to a public hosting service:

**Recommended Services:**
- **Railway** - https://railway.app (Easy, free tier available)
- **Render** - https://render.com (Good free tier)
- **Heroku** - https://heroku.com (Paid)
- **Fly.io** - https://fly.io (Good for Node.js)
- **AWS/Google Cloud** - For production

**Steps:**

1. Push your code to GitHub
2. Connect to Railway/Render
3. Set environment variables:
   ```
   NODE_ENV=production
   PORT=3000
   ```
4. Deploy
5. Get your backend URL (e.g., `https://whatsapp-bridge-123.railway.app`)
6. Set environment variable in your frontend:
   ```
   REACT_APP_API_URL=https://whatsapp-bridge-123.railway.app
   ```

### Option 2: Use ngrok for Testing (TEMPORARY)

If you want to test the deployed frontend with your local backend:

**Install ngrok:**
```bash
npm install -g ngrok
```

**Expose your localhost:**
```bash
ngrok http 3000
```

You'll get a URL like: `https://abc123.ngrok.io`

**Use it in your frontend:**
```
REACT_APP_API_URL=https://abc123.ngrok.io
```

**Note:** ngrok URLs change every time you restart. It's only for testing.

### Option 3: Same Domain Deployment (BEST PRACTICE)

Deploy frontend and backend on the same domain:

**Example:**
- Frontend: `https://myapp.com/`
- Backend: `https://myapp.com/api/*`

**How to set up:**
1. Deploy backend to the same server
2. Use a reverse proxy (Nginx) to route requests:
   - `/api/*` → Node.js backend (port 3000)
   - `/*` → React frontend (built files)

**Frontend doesn't need API_BASE configuration** (uses relative paths)

## Environment Configuration

### Development (localhost)
```
REACT_APP_API_URL=http://localhost:3000
```

### Production (Deployed)
```
REACT_APP_API_URL=https://api.myapp.com
# or for same domain
REACT_APP_API_URL=https://myapp.com
```

## Using the API from External Applications

Once your backend is deployed, external apps can call your API:

### Using from Another App

**Example: Send WhatsApp Message**

```bash
curl 'https://api.myapp.com/send/text?access_token=YOUR_API_KEY&instance_id=inst_123&to=919999999999&message=Hello'
```

### Important Security Notes

1. **Never expose `localhost` in production** - Always use actual domain URLs
2. **Use HTTPS in production** - Not HTTP
3. **Validate API tokens** - The `/send/text` endpoint validates tokens
4. **Set CORS properly** - Configure which domains can access your API:
   ```javascript
   app.use(cors({
     origin: ['https://myapp.com', 'https://external-app.com'],
     credentials: true
   }));
   ```

## Current Implementation

Your app now uses dynamic configuration in `config.ts`:

```typescript
// Automatically detects environment
export function getApiBaseUrl(): string {
  if (hostname === 'localhost') {
    return 'http://localhost:3000';
  }
  return process.env.REACT_APP_API_URL || `${protocol}//${hostname}`;
}
```

This means:
- **Local development:** Automatically uses `http://localhost:3000`
- **Deployed app:** Uses `REACT_APP_API_URL` environment variable

## Deployment Checklist

- [ ] Deploy backend to public server (Railway, Render, etc.)
- [ ] Get backend URL (e.g., `https://api.myapp.com`)
- [ ] Set `REACT_APP_API_URL` in frontend build
- [ ] Test API endpoints with Postman
- [ ] Test from deployed frontend
- [ ] Test from external applications
- [ ] Enable HTTPS (not HTTP)
- [ ] Configure CORS for your domains
- [ ] Secure API tokens (never commit to git)

## Testing the API

### Using Postman

1. Open Postman
2. Set URL: `https://api.myapp.com/send/text`
3. Add query parameters:
   - `access_token` = Your API key
   - `instance_id` = WhatsApp instance ID
   - `to` = Phone number (919999999999)
   - `message` = Your message
4. Click Send

### Using curl

```bash
curl 'https://api.myapp.com/send/text?access_token=YOUR_KEY&instance_id=inst_123&to=919999999999&message=Hello'
```

### Expected Response

```json
{
  "success": true,
  "message": "Message sent successfully",
  "message_id": "BAA00AA0000A00A0",
  "timestamp": "2026-01-02T10:30:00.000Z"
}
```

## Troubleshooting

### "Cannot reach localhost from deployed app"
→ Deploy your backend to a public server and use that URL

### "CORS error when calling API"
→ Update CORS configuration in server.cjs to allow your domain

### "API works locally but not in production"
→ Check that `REACT_APP_API_URL` is set correctly in production build

### "API token not working"
→ Make sure the token is generated through the frontend and exists in `api_keys.json`

## Next Steps

1. Choose your deployment option (Option 1 recommended)
2. Deploy backend
3. Set environment variables
4. Test with Postman
5. Test from deployed frontend
6. Integrate with external applications

---

**Questions?** Check that your backend URL is accessible from any device/server before integrating.
