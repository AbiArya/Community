# AWS Infrastructure

This directory contains all AWS-specific code for migrating the Community Friends App from Supabase to AWS.

## Directory Structure

```
aws/
├── cdk/              # Infrastructure as Code (AWS CDK)
│   ├── bin/          # CDK app entry point
│   ├── lib/          # Stack definitions
│   └── package.json  # CDK dependencies
├── lambdas/          # Lambda function code
│   ├── auth/         # Authentication functions
│   ├── matching/     # Match generation
│   ├── websocket/    # WebSocket handlers
│   └── shared/       # Shared utilities
├── migrations/       # Database migration scripts
├── scripts/          # Setup and deployment scripts
└── docs/            # Documentation
```

## Quick Start

### 1. Phase 0 Setup

Run the automated setup script:

```bash
./aws/scripts/setup-phase0.sh
```

Or follow the manual steps in `docs/PHASE-0-CHECKLIST.md`

### 2. Deploy Infrastructure

Follow the guide in `QUICK-START.md`:

```bash
cd aws/cdk

# Deploy network (VPC, subnets, security groups)
cdk deploy CommunityNetwork-dev

# Deploy database (RDS PostgreSQL with PostGIS)
cdk deploy CommunityDatabase-dev

# Deploy storage (S3 + CloudFront)
cdk deploy CommunityStorage-dev
```

## Available Stacks

### Development Environment

- `CommunityNetwork-dev` - VPC, subnets, NAT gateway
- `CommunityDatabase-dev` - RDS PostgreSQL with PostGIS
- `CommunityStorage-dev` - S3 bucket + CloudFront CDN

### Production Environment

- `CommunityNetwork-prod` - Production VPC
- `CommunityDatabase-prod` - Multi-AZ RDS with backups
- `CommunityStorage-prod` - Production S3 + CloudFront

## Environment Variables

Copy `env.aws.template` to `.env.aws.local` and fill in your values:

```bash
cp ../env.aws.template ../.env.aws.local
```

Required variables:
- `AWS_REGION` - Your AWS region (us-east-1)
- `AWS_ACCOUNT_ID` - Your AWS account ID
- `AWS_PROFILE` - AWS CLI profile name (community-app)

## Useful Commands

### CDK Commands

```bash
# List all stacks
cdk list

# Synthesize CloudFormation template
cdk synth CommunityNetwork-dev

# Show what will change
cdk diff CommunityNetwork-dev

# Deploy a stack
cdk deploy CommunityNetwork-dev

# Deploy all stacks
cdk deploy --all

# Destroy a stack (careful!)
cdk destroy CommunityNetwork-dev
```

### AWS CLI Commands

```bash
# Check authentication
aws sts get-caller-identity

# List RDS instances
aws rds describe-db-instances

# List S3 buckets
aws s3 ls

# Get secret value
aws secretsmanager get-secret-value --secret-id community-db-credentials-dev
```

## Migration Progress

Follow the migration plan in `/AWS-MIGRATION-PLAN.md`

Current status:
- [x] Phase 0: Preparation & Setup
- [ ] Phase 1: Database Migration
- [ ] Phase 2: Storage Migration
- [ ] Phase 3: Authentication Migration
- [ ] Phase 4: Lambda + API
- [ ] Phase 5: Real-time Messaging
- [ ] Phase 6: Deployment
- [ ] Phase 7: Monitoring
- [ ] Phase 8: Security
- [ ] Phase 9: Cutover

## Documentation

- `QUICK-START.md` - Step-by-step deployment guide
- `docs/PHASE-0-CHECKLIST.md` - Phase 0 checklist
- `docs/database-schema-snapshot.md` - Current database schema
- `/AWS-MIGRATION-PLAN.md` - Complete migration plan

## Cost Estimates

### Development (Free Tier)
- RDS db.t4g.micro: FREE (750 hours/month)
- Lambda: FREE (1M requests/month)
- S3 + CloudFront: FREE (first year)
- **Total: ~$0-5/month**

### Production
- RDS: ~$25/month
- Lambda + API Gateway: ~$10/month
- S3 + CloudFront: ~$10/month
- Redis: ~$12/month
- **Total: ~$60-80/month**

## Security Notes

- Never commit `.env.aws.local` or AWS credentials
- Use IAM roles for Lambda functions (not access keys)
- Enable MFA on AWS root account
- Follow principle of least privilege for IAM policies
- Enable CloudTrail for audit logging

## Troubleshooting

### CDK Deploy Fails

```bash
# View detailed logs
cdk deploy CommunityNetwork-dev --verbose

# Check CloudFormation events
aws cloudformation describe-stack-events --stack-name CommunityNetwork-dev
```

### Can't Connect to RDS

- Check security group allows your IP
- Verify database is "Available" in RDS console
- Confirm correct endpoint and credentials

### CDK Bootstrap Issues

```bash
cdk bootstrap aws://$CDK_DEFAULT_ACCOUNT/$CDK_DEFAULT_REGION --force
```

## Support

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Free Tier](https://aws.amazon.com/free/)
- [r/aws on Reddit](https://reddit.com/r/aws)
