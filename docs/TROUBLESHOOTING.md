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

## Paths like /truthordare and /trivia don’t show the app (404 or blank)

When you open or refresh `https://yoursite.com/truthordare` or `https://yoursite.com/trivia`, the server must respond with **index.html** (and status 200), not 404. Otherwise the browser never loads the React app and the path “doesn’t show the games.”

**Fix:** Configure your host to serve **index.html** for all paths (SPA fallback). Step‑by‑step for **AWS Amplify** and other hosts is in **[docs/SPA-REDIRECTS.md](SPA-REDIRECTS.md)**. In short: add a **Rewrite (200)** rule so source `/<<*>>` (or the SPA regex) targets `/index.html`.

## Truth or Dare — "Failed to create game" / "Failed to join room"

### Symptom
When choosing **Play with others** → **Create game** (or **Join game**), the UI shows an error like "Failed to create room" or "Could not create room".

### Causes and fixes

1. **Room API not deployed**  
   The app calls `/truthordare/room` (and `/truthordare/room/join`). If that route is not set up on your API Gateway, you get 404.  
   - Deploy the Lambda in `lambda/truthordare/room.js` and add GET/POST `/truthordare/room` and POST `/truthordare/room/join` in API Gateway (see `lambda/truthordare/README.md`).  
   - Or use a **different room service** (e.g. from another repo): set `VITE_TRUTHORDARE_ROOM_API_BASE` in `.env` to that service’s base URL. The frontend expects the same API shape (create → `{ roomId, gameCode, players }`, join → `{ roomId, players, state }`, GET room → `{ players, state, updatedAt }`, POST with `{ roomId, state }` to update). If your service uses a different API, share its docs or the other repo’s room code so we can add an adapter.

2. **Network / CORS**  
   If the error says "Network error" or "Failed to fetch", the browser may be blocking the request (CORS or wrong URL).  
   - In dev, the app uses the Vite proxy: requests go to `/api`, which is proxied to your API base. Ensure `vite.config.js` proxy target includes the path your room API is on.  
   - If you use a separate base for the room service, set `VITE_TRUTHORDARE_ROOM_API_BASE` to that URL (and ensure that host allows your app’s origin).

3. **Database**  
   If you use the Lambda room API, the `truthordare_rooms` table must exist. Run `docs/aws-infrastructure/truthordare-rooms-table.sql` in your `wordslide_game` database.

4. **"Missing authentication token"**  
   API Gateway or your room service may require an **API key** or **Bearer token**.  
   - **API key:** In `.env` set `VITE_TRUTHORDARE_ROOM_API_KEY=your-api-key` (or `VITE_API_KEY`). The app sends it as the `x-api-key` header on room requests. Restart the dev server after changing.  
   - **Bearer token:** If you’re logged in to WordSlide, the app now sends your auth token (`Authorization: Bearer …`) on room requests. If the customhomepage/room service expects a different token, add that repo to the workspace or paste how it sends auth so we can match it.
