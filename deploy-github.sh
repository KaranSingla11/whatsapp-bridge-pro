#!/bin/bash
# Deploy to GitHub script

cd "$(dirname "$0")" || exit 1

# Configure git
git config --global user.name "WhatsApp Bridge Pro Dev" 2>/dev/null || true
git config --global user.email "dev@whatsappbridge.local" 2>/dev/null || true

echo "📦 Initializing Git repository..."
git init

echo "📝 Adding all files..."
git add .

echo "✅ Creating initial commit..."
git commit -m "WhatsApp Bridge Pro - Ready for Render deployment

Features:
- Full-stack WhatsApp bridge with web UI
- Real-time message streaming via SSE
- API key management and public API endpoints
- Session persistence
- Docker containerized for Render.com deployment
- Tailwind CSS responsive design

Ready to deploy on Render.com!"

echo ""
echo "🔗 To push to GitHub:"
echo ""
echo "1. Create a new repository at https://github.com/new"
echo "   - Name: whatsapp-bridge-pro"
echo "   - Make it PUBLIC"
echo "   - Click 'Create Repository'"
echo ""
echo "2. Run these commands:"
echo ""
echo "   git remote add origin https://github.com/YOUR_USERNAME/whatsapp-bridge-pro.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "✨ Then your repo will be ready for Render deployment!"
