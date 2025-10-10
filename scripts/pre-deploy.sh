#!/bin/bash

# Pre-deployment script to ensure quality
# Run this before deploying to production

set -e  # Exit on any error

echo "🔍 Running pre-deployment checks..."
echo ""

# Check if we're on the right branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"
echo ""

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
  echo "⚠️  Warning: You have uncommitted changes"
  git status --short
  echo ""
  read -p "Continue anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
  fi
fi

# Install dependencies if needed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi
echo "✅ Dependencies OK"
echo ""

# Run tests
echo "🧪 Running tests..."
npm test
if [ $? -ne 0 ]; then
  echo "❌ Tests failed! Fix tests before deploying."
  exit 1
fi
echo "✅ All tests passed"
echo ""

# Check test coverage
echo "📊 Checking test coverage..."
npm run test:coverage > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "⚠️  Warning: Coverage check failed"
else
  echo "✅ Coverage check passed"
fi
echo ""

# Build the project
echo "🏗️  Building project..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed! Fix build errors before deploying."
  exit 1
fi
echo "✅ Build successful"
echo ""

# Check build size
if [ -d "dist" ]; then
  BUILD_SIZE=$(du -sh dist | cut -f1)
  echo "📦 Build size: $BUILD_SIZE"
  echo ""
fi

# All checks passed
echo "✅ All pre-deployment checks passed!"
echo ""
echo "🚀 Ready to deploy!"
echo ""
echo "To deploy, run:"
echo "  git push origin $CURRENT_BRANCH"
echo ""

