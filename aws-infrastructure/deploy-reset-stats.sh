#!/bin/bash

# Deploy reset-stats Lambda function
echo "Deploying reset-stats Lambda function..."

# First, deploy the CloudFormation stack to create the Lambda function
echo "Deploying CloudFormation stack..."
aws cloudformation deploy \
  --template-file cloudformation.yaml \
  --stack-name wordslide-dev \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides Environment=dev

# Create deployment package
cd ../lambda/user
npm install
zip -r reset-stats.zip .

# Deploy to AWS Lambda
aws lambda update-function-code \
  --function-name dev-wordslide-reset-stats \
  --zip-file fileb://reset-stats.zip

# Clean up
rm reset-stats.zip

echo "Reset stats Lambda function deployed successfully!"
