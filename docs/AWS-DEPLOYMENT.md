# AWS Deployment Guide

This guide covers deploying WordSlide to AWS with a serverless backend and managed database.

## Architecture Overview

```
Frontend (Amplify) → API Gateway → Lambda Functions → RDS PostgreSQL
```

- **Frontend**: React app deployed via AWS Amplify
- **Backend**: Serverless Lambda functions
- **Database**: Managed PostgreSQL on RDS
- **API**: RESTful API via API Gateway
- **Security**: VPC, security groups, IAM roles

## Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI installed and configured
3. Node.js (v16 or higher)
4. Git repository for your code

## Quick Deployment

### Option A: Automated Deployment (Recommended)

```bash
cd aws-infrastructure
./deploy.sh
```

### Option B: Manual Deployment

1. **Create VPC and Networking**
2. **Deploy RDS PostgreSQL Database**
3. **Create Lambda Functions**
4. **Set up API Gateway**
5. **Configure Security Groups**

## Database Setup

### Initialize Database Schema

```bash
psql -h your-db-endpoint.amazonaws.com \
     -p 5432 \
     -U postgres \
     -d postgres \
     -f init-database.sql
```

### Environment Variables

```env
DB_HOST=your-db-endpoint.amazonaws.com
DB_PORT=5432
DB_NAME=wordslide_game
DB_USER=postgres
DB_PASSWORD=your-secure-password
```

## Lambda Functions

### Authentication Functions
- `register` - User registration
- `login` - User authentication

### Game Functions
- `stats` - Game statistics
- `leaderboard` - Leaderboard data
- `complete-game` - Game completion tracking

### User Functions
- `profile` - User profile management
- `reset-stats` - Reset user statistics

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### Game Data
- `POST /game/stats` - Update game statistics
- `GET /game/leaderboard` - Get leaderboard
- `POST /game/complete` - Save game completion

### User Management
- `GET /user/profile` - Get user profile
- `POST /user/reset-stats` - Reset user stats

## Security Configuration

### IAM Roles
- Lambda execution role with RDS permissions
- VPC access for Lambda functions
- CloudWatch logging permissions

### Security Groups
- Database security group (port 5432)
- Lambda security group (outbound HTTPS)

### VPC Configuration
- Public subnets for API Gateway
- Private subnets for RDS and Lambda
- NAT Gateway for outbound internet access

## Monitoring and Logs

### CloudWatch
- Lambda function logs
- API Gateway logs
- Database performance insights

### Alarms
- Database connection failures
- Lambda function errors
- API Gateway 5xx errors

## Cost Optimization

### Lambda
- Use appropriate memory allocation
- Set reasonable timeout values
- Monitor cold start performance

### RDS
- Use appropriate instance size
- Enable automated backups
- Monitor storage usage

### API Gateway
- Use appropriate caching
- Monitor request volume
- Optimize payload sizes

## Troubleshooting

### Common Issues

1. **Database Connection Timeouts**
   - Check security group rules
   - Verify VPC configuration
   - Check Lambda subnet configuration

2. **Lambda Function Errors**
   - Check CloudWatch logs
   - Verify environment variables
   - Check IAM permissions

3. **API Gateway Issues**
   - Check CORS configuration
   - Verify Lambda integration
   - Check request/response mapping

### Debug Commands

```bash
# Check Lambda function logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/wordslide

# Test database connection
aws rds describe-db-instances --db-instance-identifier your-db-name

# Check API Gateway
aws apigateway get-rest-apis
```

## Scaling Considerations

### Horizontal Scaling
- Lambda functions auto-scale
- RDS read replicas for read-heavy workloads
- API Gateway handles high traffic automatically

### Vertical Scaling
- Increase RDS instance size
- Optimize Lambda memory allocation
- Use provisioned concurrency for critical functions

## Backup and Recovery

### Database Backups
- Automated daily backups
- Point-in-time recovery
- Cross-region backup replication

### Application Backup
- Source code in Git
- Infrastructure as Code (CloudFormation)
- Lambda function versions

## Security Best Practices

### Data Protection
- Encrypt data at rest and in transit
- Use IAM roles instead of access keys
- Regular security audits

### Network Security
- VPC with private subnets
- Security groups with minimal access
- WAF for API protection

### Access Control
- Multi-factor authentication
- Principle of least privilege
- Regular access reviews

## Cost Monitoring

### AWS Cost Explorer
- Monitor monthly costs
- Set up billing alerts
- Analyze cost by service

### Budgets
- Set monthly cost budgets
- Configure alert thresholds
- Track spending trends

## Performance Optimization

### Lambda Optimization
- Use connection pooling for database
- Optimize cold start times
- Monitor memory usage

### Database Optimization
- Use appropriate indexes
- Monitor query performance
- Regular maintenance windows

### API Optimization
- Implement caching strategies
- Optimize response payloads
- Use compression

## Maintenance

### Regular Tasks
- Update dependencies
- Monitor security patches
- Review and optimize costs
- Update documentation

### Monitoring
- Set up CloudWatch dashboards
- Configure alerting
- Regular performance reviews

## Support Resources

### AWS Documentation
- [Lambda Developer Guide](https://docs.aws.amazon.com/lambda/)
- [RDS User Guide](https://docs.aws.amazon.com/rds/)
- [API Gateway Developer Guide](https://docs.aws.amazon.com/apigateway/)

### Community
- AWS Forums
- Stack Overflow
- GitHub Issues

## Next Steps

1. Deploy infrastructure
2. Initialize database
3. Test API endpoints
4. Deploy frontend
5. Monitor and optimize
