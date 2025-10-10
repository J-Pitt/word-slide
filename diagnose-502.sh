#!/bin/bash

echo "🔍 WordSlide 502 Error Diagnostic"
echo "=================================="
echo ""

# Check 1: List Lambda functions
echo "1️⃣ Checking Lambda functions..."
aws lambda list-functions --query 'Functions[?contains(FunctionName, `wordslide`)].{Name:FunctionName, Timeout:Timeout, Runtime:Runtime}' --output table
echo ""

# Check 2: Get detailed config for stats function
echo "2️⃣ Checking stats Lambda configuration..."
aws lambda get-function-configuration --function-name dev-wordslide-stats --query '{Timeout:Timeout, Memory:MemorySize, VPC:VpcConfig.VpcId, SecurityGroups:VpcConfig.SecurityGroupIds, Subnets:VpcConfig.SubnetIds}' 2>/dev/null || echo "❌ Could not find dev-wordslide-stats function"
echo ""

# Check 3: Get recent Lambda logs
echo "3️⃣ Checking recent Lambda logs (last 10 minutes)..."
aws logs tail /aws/lambda/dev-wordslide-stats --since 10m --format short 2>/dev/null || echo "❌ Could not access logs"
echo ""

# Check 4: Check RDS status
echo "4️⃣ Checking RDS database status..."
aws rds describe-db-instances --query 'DBInstances[?contains(DBInstanceIdentifier, `wordslide`)].{Name:DBInstanceIdentifier, Status:DBInstanceStatus, Endpoint:Endpoint.Address}' --output table 2>/dev/null || echo "❌ Could not find RDS instance"
echo ""

# Check 5: Test API endpoint directly
echo "5️⃣ Testing API endpoint..."
curl -s -X POST "https://63jgwqvqyf.execute-api.us-east-1.amazonaws.com/dev/game/stats" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"userId":1,"gameMode":"easy","wordsSolved":3,"totalMoves":10}' \
  -w "\nHTTP Status: %{http_code}\n"
echo ""

echo "=================================="
echo "✅ Diagnostic complete!"
echo ""
echo "Next steps:"
echo "  • If Timeout is 3 seconds → Increase to 10+ seconds"
echo "  • If logs show ETIMEDOUT → Database connection issue"
echo "  • If logs show Task timed out → Increase Lambda timeout"
echo "  • If RDS is not available → Wait for RDS to start"

