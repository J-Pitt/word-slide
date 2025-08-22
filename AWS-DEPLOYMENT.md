# 🚀 WordSlide Game - AWS Deployment Guide

This guide will walk you through deploying your WordSlide game to AWS with a serverless backend, managed database, and global CDN distribution.

## 🎯 **What We're Building**

```
Frontend (Amplify) → API Gateway → Lambda Functions → RDS PostgreSQL
```

- **Frontend**: React app deployed via AWS Amplify
- **Backend**: Serverless Lambda functions
- **Database**: Managed PostgreSQL on RDS
- **API**: RESTful API via API Gateway
- **Security**: VPC, security groups, IAM roles

## 📋 **Prerequisites**

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **Node.js** (v16 or higher)
4. **Git** repository for your code

## 🔧 **Step 1: AWS CLI Setup**

```bash
# Install AWS CLI (if not already installed)
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# Configure AWS credentials
aws configure
# Enter your Access Key ID, Secret Access Key, Region, and output format
```

## 🏗️ **Step 2: Deploy Infrastructure**

### **Option A: Automated Deployment (Recommended)**

```bash
# Navigate to the AWS infrastructure directory
cd aws-infrastructure

# Run the deployment script
./deploy.sh
```

This script will:
- Create VPC and networking
- Deploy RDS PostgreSQL database
- Create Lambda functions
- Set up API Gateway
- Configure security groups and IAM roles

### **Option B: Manual CloudFormation Deployment**

```bash
# Create S3 bucket for templates
aws s3 mb s3://wordslide-game-templates-$(aws sts get-caller-identity --query Account --output text)

# Upload template
aws s3 cp cloudformation.yaml s3://wordslide-game-templates-$(aws sts get-caller-identity --query Account --output text)/

# Deploy stack
aws cloudformation deploy \
  --template-url "https://wordslide-game-templates-$(aws sts get-caller-identity --query Account --output text).s3.amazonaws.com/cloudformation.yaml" \
  --stack-name wordslide-game \
  --parameter-overrides Environment=dev DatabasePassword=your-secure-password JWTSecret=your-jwt-secret \
  --capabilities CAPABILITY_NAMED_IAM
```

## 🗄️ **Step 3: Initialize Database**

After the CloudFormation stack is deployed:

```bash
# Get database endpoint from stack outputs
DB_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name wordslide-game \
  --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
  --output text)

# Initialize database schema
psql -h $DB_ENDPOINT -p 5432 -U postgres -d postgres -f setup-database.sql
```

## 🔧 **Step 4: Deploy Lambda Functions**

```bash
# Navigate to lambda directory
cd lambda

# Install dependencies and build
npm install
npm run build

# Deploy functions
npm run deploy
```

## 🌐 **Step 5: Deploy Frontend to Amplify**

### **5.1: Connect Repository**

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "New app" → "Host web app"
3. Choose your Git provider (GitHub, GitLab, etc.)
4. Select your WordSlide repository
5. Choose the main branch

### **5.2: Configure Build Settings**

Amplify will auto-detect React, but you can customize the build:

```yaml
# amplify.yml (optional)
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

### **5.3: Set Environment Variables**

In the Amplify Console, add these environment variables:

```env
REACT_APP_API_BASE=https://your-api-gateway-url.amazonaws.com/dev/api
REACT_APP_ENVIRONMENT=production
REACT_APP_GAME_VERSION=1.0.0
```

## 🔐 **Step 6: Security Configuration**

### **6.1: Update CORS Settings**

In API Gateway, ensure CORS is enabled for your domain:

```json
{
  "Access-Control-Allow-Origin": "https://your-amplify-domain.amplifyapp.com",
  "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
}
```

### **6.2: Database Security**

- RDS is in private subnets
- Only Lambda functions can access it
- SSL connections enabled
- Automated backups configured

## 🧪 **Step 7: Testing**

### **7.1: Test API Endpoints**

```bash
# Test registration
curl -X POST https://your-api-gateway-url.amazonaws.com/dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Test login
curl -X POST https://your-api-gateway-url.amazonaws.com/dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

### **7.2: Test Frontend**

1. Visit your Amplify app URL
2. Try registering a new user
3. Test login functionality
4. Verify leaderboard displays
5. Check game stats tracking

## 📊 **Step 8: Monitoring & Maintenance**

### **8.1: CloudWatch Monitoring**

- Lambda function metrics
- API Gateway performance
- RDS database metrics
- Custom application metrics

### **8.2: Logs**

```bash
# View Lambda logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/dev-wordslide"

# View API Gateway logs
aws logs describe-log-groups --log-group-name-prefix "API-Gateway-Execution-Logs"
```

### **8.3: Scaling**

- **Lambda**: Automatically scales based on demand
- **RDS**: Can upgrade instance class or enable Multi-AZ
- **API Gateway**: Handles traffic spikes automatically

## 💰 **Cost Optimization**

### **Estimated Monthly Costs (us-east-1)**

- **RDS t3.micro**: ~$15/month
- **Lambda**: ~$1-5/month (depending on usage)
- **API Gateway**: ~$1-3/month
- **Data Transfer**: ~$1-5/month
- **Total**: ~$20-30/month

### **Cost Saving Tips**

1. **RDS**: Use t3.micro for development, scale up for production
2. **Lambda**: Optimize function execution time
3. **Data Transfer**: Use CloudFront for global distribution
4. **Storage**: Enable RDS storage autoscaling

## 🔄 **Updates & Maintenance**

### **Updating Lambda Functions**

```bash
cd lambda
npm run build
npm run deploy
```

### **Updating Infrastructure**

```bash
cd aws-infrastructure
# Modify cloudformation.yaml
aws cloudformation deploy --template-file cloudformation.yaml --stack-name wordslide-game
```

### **Database Migrations**

```sql
-- Add new columns or tables as needed
ALTER TABLE game_stats ADD COLUMN new_feature VARCHAR(50);
```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Lambda Timeout**
   - Increase timeout in CloudFormation
   - Optimize database queries
   - Use connection pooling

2. **CORS Errors**
   - Check API Gateway CORS settings
   - Verify allowed origins
   - Test with Postman first

3. **Database Connection Issues**
   - Verify security group rules
   - Check VPC configuration
   - Ensure Lambda has VPC access

4. **Authentication Failures**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Validate request headers

### **Debug Commands**

```bash
# Test database connectivity
aws rds describe-db-instances --db-instance-identifier dev-wordslide-db

# Check Lambda function status
aws lambda get-function --function-name dev-wordslide-register

# View API Gateway resources
aws apigateway get-rest-apis
```

## 🎉 **Success!**

Your WordSlide game is now running on AWS with:
- ✅ Global CDN distribution
- ✅ Serverless backend
- ✅ Managed database
- ✅ Automatic scaling
- ✅ Enterprise security
- ✅ Professional monitoring

## 📚 **Next Steps**

1. **Custom Domain**: Set up a custom domain in Amplify
2. **SSL Certificate**: Enable HTTPS (automatic with Amplify)
3. **Analytics**: Add CloudWatch custom metrics
4. **Backup Strategy**: Configure automated RDS backups
5. **Disaster Recovery**: Set up cross-region replication

## 🆘 **Need Help?**

- **AWS Documentation**: [aws.amazon.com/documentation](https://aws.amazon.com/documentation/)
- **Amplify Console**: Built-in troubleshooting guides
- **CloudFormation**: Stack events and rollback information
- **AWS Support**: Available with paid support plans

Happy gaming on AWS! 🎮☁️
