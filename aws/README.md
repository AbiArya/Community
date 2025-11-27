# AWS Infrastructure for Community Friends App

This directory contains all AWS-related infrastructure code, Lambda functions, and migration scripts for moving from Supabase to AWS.

## Directory Structure

```
aws/
├── cdk/                    # Infrastructure as Code (AWS CDK)
│   ├── bin/               # CDK app entry point
│   ├── lib/               # CDK stack definitions
│   │   ├── network-stack.ts       # VPC, subnets, security groups
│   │   ├── database-stack.ts      # RDS PostgreSQL with PostGIS
│   │   ├── storage-stack.ts       # S3 + CloudFront
│   │   ├── auth-stack.ts          # (TODO) Cognito
│   │   ├── api-stack.ts           # (TODO) API Gateway + Lambda
│   │   ├── messaging-stack.ts     # (TODO) AppSync or WebSockets
│   │   └── monitoring-stack.ts    # (TODO) CloudWatch dashboards
│   ├── cdk.json           # CDK configuration
│   ├── package.json       # CDK dependencies
│   └── tsconfig.json      # TypeScript config
│
├── lambdas/               # Lambda function code
│   ├── shared/            # Shared utilities
│   ├── matching/          # (TODO) Match generation functions
│   ├── auth/              # (TODO) Custom auth flows
│   ├── websocket/         # (TODO) WebSocket handlers
│   └── image-processor/   # (TODO) Image optimization
│
├── migrations/            # Database migration scripts
│   ├── schema.sql         # (TODO) AWS-compatible schema
│   ├── export-supabase-data.ts   # (TODO) Data export
│   └── migrate-from-supabase.ts  # (TODO) Migration script
│
├── appsync/               # (TODO) AppSync GraphQL schema
│   ├── schema.graphql
│   └── resolvers/
│
├── docs/                  # Documentation
│   └── architecture.md    # (TODO) Architecture diagrams
│
├── AWS-MIGRATION-PLAN.md  # Complete migration plan
├── QUICK-START.md         # Getting started guide
└── README.md              # This file
```

## Current Status

### ✅ Completed
- Network infrastructure (VPC, subnets, security groups)
- Database infrastructure (RDS PostgreSQL with PostGIS)
- Storage infrastructure (S3 + CloudFront)
- CDK boilerplate and configuration

### 🚧 In Progress
- Nothing yet - ready to start Phase 1!

### ⏳ TODO
- Database schema migration (Phase 1.2)
- Data migration from Supabase (Phase 1.3)
- Lambda functions for matching (Phase 4)
- Cognito authentication (Phase 3)
- Real-time messaging with AppSync (Phase 5)
- Monitoring and alarms (Phase 7)

## Getting Started

**If you're new to AWS:**
1. Read `QUICK-START.md` first
2. Deploy the network stack
3. Deploy the database stack
4. Deploy the storage stack
5. Come back here for next steps

**If you already deployed infrastructure:**
1. Read `AWS-MIGRATION-PLAN.md`
2. Continue with Phase 1.2: Schema Migration

## Infrastructure Stacks

### NetworkStack (`network-stack.ts`)
Creates foundational networking:
- VPC (10.0.0.0/16)
- 2 Availability Zones
- Public subnets (for NAT, bastion)
- Private subnets (for Lambda)
- Database subnets (isolated, for RDS)
- Security groups for RDS and Lambda
- NAT gateway for outbound internet

**Deployed as:** `CommunityNetwork-{env}`

### DatabaseStack (`database-stack.ts`)
Creates PostgreSQL database:
- RDS PostgreSQL 15
- Instance: db.t4g.micro (dev) / db.t4g.small (prod)
- 20GB storage with auto-scaling
- Multi-AZ in production
- Automated backups (7 days)
- PostGIS extension ready
- Credentials in Secrets Manager

**Deployed as:** `CommunityDatabase-{env}`

### StorageStack (`storage-stack.ts`)
Creates photo storage:
- S3 bucket (private)
- CloudFront distribution
- CORS configuration
- Lifecycle policies
- Versioning (prod only)

**Deployed as:** `CommunityStorage-{env}`

## Deployment Commands

### Deploy All Stacks
```bash
cd aws/cdk
npm install

# Development environment
cdk deploy --all --context environment=dev

# Production environment
cdk deploy --all --context environment=prod
```

### Deploy Individual Stack
```bash
cdk deploy CommunityNetwork-dev
cdk deploy CommunityDatabase-dev
cdk deploy CommunityStorage-dev
```

### Preview Changes
```bash
cdk diff CommunityNetwork-dev
```

### Destroy Infrastructure
```bash
# Destroy specific stack
cdk destroy CommunityDatabase-dev

# Destroy all (CAREFUL!)
cdk destroy --all
```

## Environment Variables

After deploying, add these to your `.env.aws.local`:

```bash
# AWS Config
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012

# Database (from DatabaseStack outputs)
AWS_RDS_ENDPOINT=xxx.rds.amazonaws.com
AWS_RDS_PORT=5432
AWS_RDS_DATABASE=community
AWS_RDS_SECRET_ARN=arn:aws:secretsmanager:...

# Storage (from StorageStack outputs)
AWS_S3_PHOTOS_BUCKET=community-app-photos-dev-123456789012
AWS_CLOUDFRONT_DOMAIN=xxx.cloudfront.net

# API Gateway (Phase 4)
AWS_API_GATEWAY_URL=https://xxx.execute-api.us-east-1.amazonaws.com/prod

# Cognito (Phase 3)
AWS_COGNITO_USER_POOL_ID=us-east-1_xxxxx
AWS_COGNITO_CLIENT_ID=xxxxx

# AppSync (Phase 5)
AWS_APPSYNC_ENDPOINT=https://xxx.appsync-api.us-east-1.amazonaws.com/graphql
```

## Cost Monitoring

### Current Monthly Costs (Estimated)

**Development (Free Tier):**
- RDS db.t4g.micro: $0 (free tier)
- Lambda: $0 (under 1M requests)
- S3: $0 (under 5GB)
- NAT Gateway: ~$32/month ⚠️ (largest cost)
- **Total: ~$32/month**

**To reduce NAT costs in dev:**
- Option 1: Destroy when not in use
- Option 2: Remove NAT, use public subnets for Lambda (less secure)
- Option 3: VPN to your VPC, access private resources directly

**Production (After Free Tier):**
- RDS db.t4g.small: ~$25/month
- NAT Gateway: ~$32/month
- Other services: ~$20/month
- **Total: ~$80-100/month** (scales with usage)

### Set Up Billing Alerts

1. Go to [AWS Budgets](https://console.aws.amazon.com/billing/home#/budgets)
2. Create budget: "Monthly AWS Spending"
3. Set threshold: $50
4. Add your email for alerts

## Security Best Practices

### ✅ Currently Implemented
- Database in private subnets (no internet access)
- Credentials stored in Secrets Manager
- S3 bucket is private by default
- HTTPS only via CloudFront
- Security groups restrict access

### ⚠️ TODO Before Production
- [ ] Remove open database security group rule (0.0.0.0/0)
- [ ] Use bastion host or VPN for database access
- [ ] Enable MFA delete on S3 bucket
- [ ] Enable AWS GuardDuty for threat detection
- [ ] Set up AWS Config for compliance monitoring
- [ ] Implement least-privilege IAM policies
- [ ] Enable CloudTrail for audit logging
- [ ] Add WAF to CloudFront (protect against attacks)

## Monitoring & Debugging

### View Logs
```bash
# Lambda logs
aws logs tail /aws/lambda/community-matching-dev --follow

# RDS logs
aws rds describe-db-log-files --db-instance-identifier community-database-dev
```

### View Metrics
```bash
# RDS metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=community-database-dev \
  --start-time 2025-11-26T00:00:00Z \
  --end-time 2025-11-26T23:59:59Z \
  --period 3600 \
  --statistics Average
```

### AWS Console Links
- [CloudFormation Stacks](https://console.aws.amazon.com/cloudformation)
- [RDS Databases](https://console.aws.amazon.com/rds)
- [S3 Buckets](https://console.aws.amazon.com/s3)
- [Lambda Functions](https://console.aws.amazon.com/lambda)
- [CloudWatch Logs](https://console.aws.amazon.com/cloudwatch/home#logsV2:log-groups)
- [VPC Dashboard](https://console.aws.amazon.com/vpc)
- [Secrets Manager](https://console.aws.amazon.com/secretsmanager)

## Troubleshooting

### "VpcId not found"
The database stack imports VPC ID from network stack. Make sure network stack is deployed first.

### "Secret not found"
Database credentials are created with the database. Check Secrets Manager console.

### "Access Denied"
Ensure your IAM user has sufficient permissions. Check CloudTrail for denied actions.

### RDS connection timeout
- Check security group allows your IP
- Verify you're connecting to correct endpoint
- Try from Lambda (inside VPC) instead of local machine

## Next Steps

1. ✅ Infrastructure deployed
2. 📍 **You are here** - Ready to migrate schema
3. ⏳ Phase 1.2: Create database schema in RDS
4. ⏳ Phase 1.3: Migrate data from Supabase
5. ⏳ Phase 4: Deploy Lambda functions

See `AWS-MIGRATION-PLAN.md` for detailed next steps.

## Resources

- [AWS CDK Examples](https://github.com/aws-samples/aws-cdk-examples)
- [AWS Free Tier](https://aws.amazon.com/free/)
- [AWS Well-Architected](https://aws.amazon.com/architecture/well-architected/)
- [AWS Solutions Library](https://aws.amazon.com/solutions/)
- [r/aws Community](https://reddit.com/r/aws)

## Questions?

- Check `AWS-MIGRATION-PLAN.md` for detailed migration steps
- Check `QUICK-START.md` for setup instructions
- Search AWS documentation: https://docs.aws.amazon.com
- Ask in project chat or open an issue

