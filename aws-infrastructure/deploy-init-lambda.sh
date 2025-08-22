#!/bin/bash

echo "🚀 Deploying WordSlide Database Initialization Lambda"
echo "====================================================="

# Set variables
FUNCTION_NAME="wordslide-db-init"
REGION="us-east-1"
RUNTIME="nodejs18.x"
HANDLER="index.handler"
ROLE_ARN="arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/wordslide-db-init-lambda-role"

echo "📦 Installing dependencies..."
cd init-database-lambda
npm install

echo "📦 Packaging Lambda function..."
npm run package

echo "🔧 Creating Lambda function..."
aws lambda create-function \
    --function-name "$FUNCTION_NAME" \
    --runtime "$RUNTIME" \
    --role "$ROLE_ARN" \
    --handler "$HANDLER" \
    --zip-file fileb://init-database-lambda.zip \
    --region "$REGION" \
    --timeout 300 \
    --memory-size 512 \
    --vpc-config SubnetIds=subnet-0735514c3428edc71,subnet-0f72bce177786575b,SecurityGroupIds=sg-0eb6fe1920fee757a

if [ $? -eq 0 ]; then
    echo "✅ Lambda function created successfully!"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Go to AWS Lambda Console"
    echo "2. Find function: $FUNCTION_NAME"
    echo "3. Click 'Test' to run the database initialization"
    echo "4. Check CloudWatch logs for results"
else
    echo "❌ Failed to create Lambda function"
    echo "Trying to update existing function..."
    
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file fileb://init-database-lambda.zip \
        --region "$REGION"
    
    if [ $? -eq 0 ]; then
        echo "✅ Lambda function updated successfully!"
    else
        echo "❌ Failed to update Lambda function"
        exit 1
    fi
fi

echo ""
echo "🎉 Deployment completed! Your database initialization Lambda is ready."
