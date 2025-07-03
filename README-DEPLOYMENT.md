# Railway Deployment Guide

## Files Added for Deployment

- `requirements.txt` - Python dependencies (empty - using standard library only)
- `railway.toml` - Railway configuration
- `cors-proxy-server.py` - Updated to use Railway's PORT environment variable

## Deployment Steps

1. **Create GitHub Repository**
   - Push all files to a GitHub repository

2. **Sign up for Railway**
   - Go to https://railway.app
   - Sign up with GitHub account (free)

3. **Deploy from GitHub**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will automatically detect Python and deploy

4. **Access Your App**
   - Railway will provide a URL like: `https://your-app-name.railway.app`
   - The app will be live and accessible worldwide

## Configuration

- **Port**: Automatically configured via Railway's PORT environment variable
- **Domain**: Railway provides a free subdomain
- **HTTPS**: Automatically enabled
- **Auto-deploy**: Updates automatically when you push to GitHub

## Local Development

To run locally:
```bash
python3 cors-proxy-server.py
```

Then open: http://localhost:8080