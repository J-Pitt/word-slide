#!/bin/bash

# Deploy script for WordSlide PWA with cache busting
echo "🚀 Deploying WordSlide with cache busting..."

# Build the project
echo "📦 Building project..."
npm run build

# Update service worker version with timestamp
echo "🔄 Updating service worker version..."
TIMESTAMP=$(date +%s)
sed -i.bak "s/const APP_VERSION = '.*'/const APP_VERSION = '$TIMESTAMP'/g" public/sw.js
rm public/sw.js.bak

# Copy updated service worker to dist
cp public/sw.js dist/sw.js

echo "✅ Deployment ready! Service worker version: $TIMESTAMP"
echo "📱 Users will automatically get the latest version within 30 seconds"
