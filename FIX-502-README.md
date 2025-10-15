# 🔧 Fix 502 Bad Gateway Error - Quick Guide

## 📋 What You Have

I've created 3 tools to help you diagnose and fix the 502 error:

### 1. **diagnose-502.sh** - Diagnostic Script
Checks your AWS Lambda and RDS configuration to identify the issue.

### 2. **fix-502.sh** - Automatic Fix Script
Increases Lambda timeout for all WordSlide functions (most common fix).

### 3. **test-api.html** - Browser-based API Tester
Test your API endpoints directly in the browser with detailed results.

---

## 🚀 Quick Fix (Most Likely Solution)

### Step 1: Run the Fix Script

```bash
chmod +x diagnose-502.sh fix-502.sh
./fix-502.sh
```

This will increase the Lambda timeout from 3 seconds to 10 seconds for all your functions.

### Step 2: Restart Your Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 3: Test the Game

- Play a level and complete it
- Check browser console
- Should see: `✅ Database update successful`

---

## 🔍 If That Didn't Work - Run Diagnostics

```bash
./diagnose-502.sh
```

This will show you:
- Lambda function configurations
- Recent error logs
- RDS database status
- API endpoint health

Look for these common issues:
- **"Task timed out"** → Lambda timeout too short (fix script should have resolved this)
- **"ETIMEDOUT"** → Database connection issue (security group or VPC problem)
- **"ECONNREFUSED"** → Lambda can't reach database (VPC configuration issue)

---

## 🌐 Test API in Browser

Open `test-api.html` in your browser to:
- Test each endpoint individually
- See detailed error messages
- Check response times
- Verify all endpoints are working

Just double-click the file or open it in Chrome/Firefox.

---

## 🎯 What's Causing This?

The 502 error means:
1. ✅ Your Vite proxy is working
2. ✅ API Gateway is receiving requests
3. ❌ Lambda function is failing (timeout, error, or connection issue)

**Most common cause:** Lambda timeout (default 3 seconds is too short for database operations)

---

## 📊 Expected Results After Fix

### Before Fix:
```
POST http://localhost:3000/api/game/stats 502 (Bad Gateway)
❌ Failed to update database: Bad Gateway 502
```

### After Fix:
```
✅ Database update successful: { success: true, ... }
```

---

## 🔧 Manual Fix (If Scripts Don't Work)

### Option 1: AWS Console
1. Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda)
2. Find function: `dev-wordslide-stats`
3. Configuration → General configuration → Edit
4. Change Timeout from 3 to 10 seconds
5. Save
6. Repeat for all `dev-wordslide-*` functions

### Option 2: AWS CLI (Individual Function)
```bash
aws lambda update-function-configuration \
  --function-name dev-wordslide-stats \
  --timeout 10
```

---

## 🆘 Still Not Working?

### Check Lambda Logs
```bash
aws logs tail /aws/lambda/dev-wordslide-stats --since 10m --follow
```

Look for specific error messages and search in `docs/TROUBLESHOOTING.md` for solutions.

### Common Issues Beyond Timeout:

1. **Database Connection Issue**
   - Check Lambda is in same VPC as RDS
   - Verify security groups allow Lambda → RDS on port 5432

2. **Missing Environment Variables**
   - Check Lambda has DB_HOST, DB_USER, DB_PASSWORD set

3. **RDS Not Running**
   - Check RDS status: `aws rds describe-db-instances`

4. **Lambda in Wrong Subnet**
   - Lambda needs to be in private subnet with NAT Gateway

---

## 📚 Documentation

For comprehensive troubleshooting:
- **`docs/TROUBLESHOOTING.md`** - Complete troubleshooting guide
- **`docs/AWS-DEPLOYMENT.md`** - AWS deployment documentation
- **`docs/aws-infrastructure/DATABASE-SETUP.md`** - Database setup guide

---

## ✅ Checklist

- [ ] Run `./fix-502.sh` to increase Lambda timeouts
- [ ] Restart dev server (`npm run dev`)
- [ ] Test by completing a game level
- [ ] Check browser console for success message
- [ ] If still failing, run `./diagnose-502.sh`
- [ ] Open `test-api.html` in browser to test endpoints
- [ ] Check Lambda logs if issue persists
- [ ] Review `docs/TROUBLESHOOTING.md` for advanced fixes

---

## 🎉 Success Indicators

You'll know it's fixed when:
- ✅ No 502 errors in browser console
- ✅ See "✅ Database update successful" in console
- ✅ Leaderboard updates correctly
- ✅ Game stats are saved between sessions

---

**Most likely, running `./fix-502.sh` will resolve your issue!** 🚀

If you need more help, all the details are in `docs/TROUBLESHOOTING.md`.


