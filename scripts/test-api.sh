#!/bin/bash

# Test API Endpoints
API_BASE="https://63jgwqvqyf.execute-api.us-east-1.amazonaws.com/dev"

echo "🔍 Testing WordSlide API Endpoints..."
echo ""

# Test 1: Health check (if you have one)
echo "1️⃣ Testing API Gateway connectivity..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "${API_BASE}/auth/login"
echo ""

# Test 2: Check Lambda function logs
echo "2️⃣ Checking Lambda function logs for /game/stats..."
aws logs tail /aws/lambda/dev-wordslide-stats --since 5m --format short 2>/dev/null || echo "❌ Could not access Lambda logs (check AWS CLI configuration)"
echo ""

# Test 3: Check Lambda function status
echo "3️⃣ Checking Lambda function configuration..."
aws lambda get-function --function-name dev-wordslide-stats 2>/dev/null | jq '.Configuration | {FunctionName, Runtime, Timeout, MemorySize, LastModified}' || echo "❌ Could not get Lambda function info"
echo ""

# Test 4: Test database connectivity from Lambda
echo "4️⃣ Testing stats endpoint with a test request..."
curl -X POST "${API_BASE}/game/stats" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"userId":1,"gameMode":"easy","wordsSolved":3,"totalMoves":10}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s
echo ""

# Test 5: Check RDS instance status
echo "5️⃣ Checking RDS database status..."
aws rds describe-db-instances --query 'DBInstances[?contains(DBInstanceIdentifier, `wordslide`)].{Name:DBInstanceIdentifier,Status:DBInstanceStatus,Endpoint:Endpoint.Address}' --output table 2>/dev/null || echo "❌ Could not access RDS info"
echo ""

echo "✅ Diagnostic complete!"
echo ""
echo "Common fixes:"
echo "  1. Lambda function timeout - increase timeout in AWS Console"
echo "  2. Database connection - check security groups and VPC config"
echo "  3. Lambda cold start - first request after idle may timeout"
echo "  4. Lambda environment variables - verify DB credentials are set"

