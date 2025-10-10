#!/bin/bash

echo "🔧 Fixing WordSlide Lambda Timeouts"
echo "===================================="
echo ""

# List of all WordSlide Lambda functions
functions=(
  "dev-wordslide-stats"
  "dev-wordslide-login"
  "dev-wordslide-register"
  "dev-wordslide-leaderboard"
  "dev-wordslide-complete-game"
  "dev-wordslide-reset-stats"
  "dev-wordslide-profile"
)

echo "Updating timeout to 10 seconds for all functions..."
echo ""

success_count=0
fail_count=0

for func in "${functions[@]}"; do
  echo "📦 Updating $func..."
  
  result=$(aws lambda update-function-configuration \
    --function-name "$func" \
    --timeout 10 \
    --query '{Function:FunctionName, NewTimeout:Timeout}' \
    --output text 2>&1)
  
  if [ $? -eq 0 ]; then
    echo "   ✅ Success: $result"
    ((success_count++))
  else
    echo "   ⚠️  Skipped or failed: $func (may not exist)"
    ((fail_count++))
  fi
  echo ""
done

echo "===================================="
echo "📊 Summary:"
echo "   ✅ Successfully updated: $success_count functions"
echo "   ⚠️  Skipped/Failed: $fail_count functions"
echo ""
echo "🎯 Next steps:"
echo "   1. Restart your dev server: npm run dev"
echo "   2. Test the game by completing a level"
echo "   3. Check console - should see '✅ Database update successful'"
echo ""
echo "If issues persist, run: ./diagnose-502.sh"

