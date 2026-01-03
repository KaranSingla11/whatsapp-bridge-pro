@echo off
REM Deploy to GitHub script for Windows

echo.
echo ==========================================
echo WhatsApp Bridge Pro - GitHub Deployment
echo ==========================================
echo.

cd /d "%~dp0"

echo Configuring Git...
git config --global user.name "WhatsApp Bridge Pro Dev" >nul 2>&1
git config --global user.email "dev@whatsappbridge.local" >nul 2>&1

echo.
echo [1/3] Initializing Git repository...
git init

echo [2/3] Adding all files...
git add .

echo [3/3] Creating initial commit...
git commit -m "WhatsApp Bridge Pro - Ready for Render deployment"

echo.
echo ✅ Repository initialized successfully!
echo.
echo.
echo ==========================================
echo Next Steps: Push to GitHub
echo ==========================================
echo.
echo 1. Go to https://github.com/new
echo    - Repository name: whatsapp-bridge-pro
echo    - Description: WhatsApp Bridge with API
echo    - Make it PUBLIC
echo    - Click "Create Repository"
echo.
echo 2. Copy the URL from GitHub (looks like):
echo    https://github.com/YOUR_USERNAME/whatsapp-bridge-pro.git
echo.
echo 3. Run these commands:
echo.
echo    git remote add origin https://github.com/YOUR_USERNAME/whatsapp-bridge-pro.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 4. After pushing, go to https://render.com
echo    - New Web Service
echo    - Select your whatsapp-bridge-pro repo
echo    - Set Environment to Docker
echo    - Click Deploy!
echo.
echo ==========================================
echo.
pause
