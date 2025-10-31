#!/bin/bash
set -euo pipefail

# Quick Build Script for Manual Deployment
# Usage: ./build-for-deploy.sh

echo "🚀 Building project for production..."

# Clean previous build
rm -rf dist/ dist.tar.gz

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Build
echo "🔨 Building..."
npm run build

# Verify build
if [ ! -d "dist" ]; then
    echo "❌ Build failed: dist directory not found"
    exit 1
fi

# Create archive
echo "📦 Creating archive..."
tar -czf dist.tar.gz dist/

# Get size
SIZE=$(du -sh dist.tar.gz | cut -f1)

echo ""
echo "✅ Build completed successfully!"
echo "📊 Archive size: $SIZE"
echo "📁 File: dist.tar.gz"
echo ""
echo "Next steps:"
echo "  1. Upload to server:"
echo "     scp dist.tar.gz root@217.198.5.230:/tmp/"
echo ""
echo "  2. On server, extract:"
echo "     cd /var/www/ai-model-landing"
echo "     tar -xzf /tmp/dist.tar.gz --strip-components=1"
echo "     systemctl reload nginx"
echo ""
