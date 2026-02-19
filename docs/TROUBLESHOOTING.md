# Troubleshooting Guide

## 502 Bad Gateway Error

### Symptom
```
POST http://localhost:3000/api/game/stats 502 (Bad Gateway)
❌ Failed to update database: Bad Gateway 502
```

### What This Means
The Vite proxy is working correctly, but the AWS API Gateway or Lambda function is returning a 502 error. This indicates a backend issue, not a frontend issue.

### Common Causes

#### 1. Lambda Function Timeout
**Problem:** Lambda function takes too long to respond (default 3 seconds)

**Solution:**
```bash
# Check Lambda timeout setting
aws lambda get-function-configuration --function-name dev-wordslide-stats --query 'Timeout'

# Increase timeout to 10 seconds
aws lambda update-function-configuration \
  --function-name dev-wordslide-stats \
  --timeout 10
```

#### 2. Database Connection Timeout
**Problem:** Lambda can't connect to RDS database

**Symptoms:**
- First request after idle period fails
- Consistent 502 errors

**Solution:**
```bash
# Check Lambda VPC configuration
aws lambda get-function-configuration \
  --function-name dev-wordslide-stats \
  --query 'VpcConfig'

# Check RDS security group allows Lambda access
aws rds describe-db-instances \
  --db-instance-identifier dev-wordslide-db \
  --query 'DBInstances[0].VpcSecurityGroups'
```

**Fix:**
1. Ensure Lambda is in the same VPC as RDS
2. Ensure Lambda security group can access RDS security group on port 5432
3. Check that RDS security group allows inbound from Lambda security group

#### 3. Lambda Function Errors
**Problem:** Lambda function is crashing or returning errors

**Solution:**
```bash
# Check recent Lambda logs
aws logs tail /aws/lambda/dev-wordslide-stats --since 10m --follow

# Look for error patterns:
# - "Task timed out"
# - "ETIMEDOUT" (database connection)
# - "ECONNREFUSED" (database not accessible)
# - JavaScript errors
```

#### 4. Environment Variables Missing
**Problem:** Lambda function missing database credentials

**Solution:**
```bash
# Check Lambda environment variables
aws lambda get-function-configuration \
  --function-name dev-wordslide-stats \
  --query 'Environment.Variables'

# Should include:
# - DB_HOST
# - DB_PORT
# - DB_NAME
# - DB_USER
# - DB_PASSWORD
```

#### 5. Cold Start Issues
**Problem:** First request after Lambda has been idle fails

**Temporary Solution:**
- Retry the request (second attempt usually works)

**Permanent Solution:**
```bash
# Enable provisioned concurrency (costs more)
aws lambda put-provisioned-concurrency-config \
  --function-name dev-wordslide-stats \
  --provisioned-concurrent-executions 1
```

### Quick Diagnostic Steps

#### Step 1: Check Lambda Logs
```bash
aws logs tail /aws/lambda/dev-wordslide-stats --since 10m
```

Look for:
- "Task timed out" → Increase timeout
- "ETIMEDOUT" → Database connection issue
- "Error: connect ECONNREFUSED" → VPC/Security group issue
- JavaScript errors → Code issue

#### Step 2: Test Lambda Directly
```bash
# Test the Lambda function directly (bypass API Gateway)
aws lambda invoke \
  --function-name dev-wordslide-stats \
  --payload '{"body":"{\"userId\":1,\"gameMode\":\"easy\",\"wordsSolved\":3,\"totalMoves\":10}"}' \
  response.json

cat response.json
```

#### Step 3: Check RDS Status
```bash
# Check if RDS is available
aws rds describe-db-instances \
  --db-instance-identifier dev-wordslide-db \
  --query 'DBInstances[0].DBInstanceStatus'

# Should return: "available"
```

#### Step 4: Test Database Connection
```bash
# Connect to database from your local machine (if bastion host available)
psql -h dev-wordslide-db.cszqcws8wjsi.us-east-1.amazonaws.com \
     -p 5432 \
     -U postgres \
     -d postgres \
     -c "SELECT version();"
```

### Most Likely Fix

Based on the error "why would it have been working earlier?", this is most likely:

**Lambda Function Timeout** (default 3 seconds is too short for database connections)

**Fix:**
1. Go to AWS Lambda Console
2. Find function: `dev-wordslide-stats`
3. Configuration → General configuration → Edit
4. Increase Timeout to 10 seconds
5. Save

**Or via CLI:**
```bash
aws lambda update-function-configuration \
  --function-name dev-wordslide-stats \
  --timeout 10
```

### Alternative: Use Production API Directly

If you need to test immediately while debugging the backend:

**In `src/App.jsx`, temporarily change:**
```javascript
// Current (uses proxy in development)
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
const API_BASE = isLocalhost 
  ? '/api'
  : 'https://63jgwqvqyf.execute-api.us-east-1.amazonaws.com/dev'
```

**To (always use production API):**
```javascript
// Temporarily bypass proxy for testing
const API_BASE = 'https://63jgwqvqyf.execute-api.us-east-1.amazonaws.com/dev'
```

**Note:** This is temporary for testing. The proxy is better for development to avoid CORS issues.

### Check All Lambda Functions

You may need to update timeout for all Lambda functions:

```bash
# List all WordSlide Lambda functions
aws lambda list-functions --query 'Functions[?contains(FunctionName, `wordslide`)].FunctionName'

# Update timeout for each one
for func in dev-wordslide-stats dev-wordslide-login dev-wordslide-register dev-wordslide-leaderboard dev-wordslide-complete-game dev-wordslide-reset-stats dev-wordslide-profile; do
  echo "Updating $func..."
  aws lambda update-function-configuration \
    --function-name $func \
    --timeout 10
done
```

### Verify Fix

After applying the fix:

1. **Restart your dev server**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Test the game**
   - Complete a level
   - Check browser console for errors
   - Should see: "✅ Database update successful"

3. **Check Lambda logs**
   ```bash
   aws logs tail /aws/lambda/dev-wordslide-stats --since 5m --follow
   ```
   - Should see successful execution logs
   - No timeout errors

### Still Not Working?

If the issue persists after increasing timeout:

1. **Check Lambda logs for specific error**
2. **Verify database is accessible**
3. **Check security group rules**
4. **Test Lambda function directly**
5. **Check CloudWatch metrics for Lambda errors**

### Contact Support

If you've tried all the above and still having issues, gather this info:

```bash
# Lambda configuration
aws lambda get-function-configuration --function-name dev-wordslide-stats > lambda-config.json

# Recent logs
aws logs tail /aws/lambda/dev-wordslide-stats --since 30m > lambda-logs.txt

# RDS status
aws rds describe-db-instances --db-instance-identifier dev-wordslide-db > rds-status.json
```

Then share these files when asking for help.

## Other Common Issues

### CORS Errors
**Symptom:** "Access-Control-Allow-Origin" error in console

**Solution:** This shouldn't happen with the Vite proxy, but if it does:
1. Check `vite.config.js` proxy configuration
2. Restart dev server
3. Clear browser cache

### Database Connection Refused
**Symptom:** Lambda logs show "ECONNREFUSED"

**Solution:**
1. Check Lambda is in correct VPC
2. Check security group rules
3. Verify RDS endpoint is correct in Lambda environment variables

### Authentication Errors
**Symptom:** 401 Unauthorized errors

**Solution:**
1. Check JWT token is being sent correctly
2. Verify token hasn't expired
3. Check Lambda function is validating token correctly

## Prevention

To avoid these issues in the future:

1. **Set appropriate Lambda timeouts during deployment** (10 seconds minimum for database functions)
2. **Monitor CloudWatch metrics** for Lambda errors and timeouts
3. **Set up CloudWatch alarms** for Lambda function errors
4. **Use connection pooling** in Lambda functions to reduce cold start impact
5. **Consider provisioned concurrency** for critical Lambda functions

