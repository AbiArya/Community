# AWS Migration Quick Start Guide

This guide will walk you through deploying your first AWS infrastructure for the Community Friends App.

## Prerequisites

1. **AWS Account** - [Create one here](https://aws.amazon.com/free/)
2. **Node.js** - Version 18+ (you already have this)
3. **AWS CLI v2** - [Installation guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
4. **AWS CDK** - We'll install this below

## Step 1: Install AWS CLI

### macOS (Homebrew)
```bash
brew install awscli
```

### macOS (Official Installer)
```bash
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /
```

Verify installation:
```bash
aws --version
# Should output: aws-cli/2.x.x ...
```

## Step 2: Configure AWS Credentials

### 2a. Create IAM User (First Time Setup)

1. Log into AWS Console: https://console.aws.amazon.com
2. Navigate to IAM → Users → Create User
3. User name: `community-app-deployer`
4. Enable "Provide user access to the AWS Management Console" (optional)
5. Click "Next"
6. Select "Attach policies directly"
7. Attach these policies:
   - `AdministratorAccess` (for learning - restrict in production!)
8. Create user
9. Go to "Security credentials" tab
10. Click "Create access key"
11. Select "Command Line Interface (CLI)"
12. Download credentials (Access Key ID + Secret Access Key)

### 2b. Configure AWS CLI

```bash
aws configure --profile community-app
```

You'll be prompted for:
- **AWS Access Key ID**: [paste from step 2a]
- **AWS Secret Access Key**: [paste from step 2a]
- **Default region**: `us-east-1` (or your preferred region)
- **Default output format**: `json`

Verify it works:
```bash
aws sts get-caller-identity --profile community-app
```

You should see your account ID and user ARN.

## Step 3: Set Environment Variables

Add to your shell profile (`~/.zshrc` or `~/.bash_profile`):

```bash
export AWS_PROFILE=community-app
export AWS_REGION=us-east-1
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
export CDK_DEFAULT_REGION=us-east-1
```

Reload your shell:
```bash
source ~/.zshrc
```

## Step 4: Install AWS CDK

```bash
npm install -g aws-cdk
```

Verify installation:
```bash
cdk --version
# Should output: 2.x.x (build ...)
```

Bootstrap CDK (first time only):
```bash
cdk bootstrap aws://$CDK_DEFAULT_ACCOUNT/$CDK_DEFAULT_REGION
```

This creates an S3 bucket and other resources CDK needs to deploy.

## Step 5: Install CDK Dependencies

Navigate to the CDK directory and install dependencies:

```bash
cd aws/cdk
npm install
```

## Step 6: Deploy Your First Stack (Network)

Let's start with just the VPC to test everything works:

```bash
# Preview what will be created
cdk synth CommunityNetwork-dev

# See the changes
cdk diff CommunityNetwork-dev

# Deploy it!
cdk deploy CommunityNetwork-dev
```

You'll be asked to confirm security changes. Type `y` and press Enter.

⏱️ This will take 3-5 minutes. CDK is creating:
- 1 VPC
- 6 subnets across 2 availability zones
- 1 NAT gateway
- Route tables and internet gateway
- 2 security groups

When complete, you'll see outputs like:
```
✅  CommunityNetwork-dev

Outputs:
CommunityNetwork-dev.VpcId = vpc-xxxxx
CommunityNetwork-dev.DatabaseSecurityGroupId = sg-xxxxx
```

🎉 **Congratulations!** You just deployed your first AWS infrastructure!

## Step 7: View in AWS Console

1. Go to [VPC Console](https://console.aws.amazon.com/vpc)
2. You should see your new VPC named `CommunityNetwork-dev/CommunityVpc`
3. Explore the subnets, route tables, and NAT gateway

## Step 8: Deploy Database Stack

Now let's deploy the RDS database:

```bash
cdk deploy CommunityDatabase-dev
```

⏱️ This will take 10-15 minutes. RDS instances take time to provision.

When complete, note the outputs:
```
Outputs:
CommunityDatabase-dev.DatabaseEndpoint = xxx.rds.amazonaws.com
CommunityDatabase-dev.DatabasePort = 5432
CommunityDatabase-dev.DatabaseSecretArn = arn:aws:secretsmanager:...
CommunityDatabase-dev.PostGISInstallCommand = psql -h xxx...
```

## Step 9: Install PostGIS Extension

Retrieve database password:
```bash
aws secretsmanager get-secret-value \
  --secret-id community-db-credentials-dev \
  --query SecretString \
  --output text | jq -r .password
```

Copy the password, then connect to database (replace `<endpoint>` with your DatabaseEndpoint):

```bash
psql -h <endpoint> -U postgres -d community
# Enter password when prompted
```

In psql, run:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
SELECT PostGIS_version();  -- Verify it's installed
\q
```

## Step 10: Deploy Storage Stack

Deploy S3 and CloudFront:

```bash
cdk deploy CommunityStorage-dev
```

⏱️ This will take 5-10 minutes. CloudFront distributions are slow to deploy.

## Step 11: Update Your .env File

Create `.env.aws.local` in your project root:

```bash
# AWS Infrastructure
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=YOUR_ACCOUNT_ID

# Database (from CommunityDatabase-dev outputs)
AWS_RDS_ENDPOINT=your-endpoint.rds.amazonaws.com
AWS_RDS_PORT=5432
AWS_RDS_DATABASE=community
AWS_RDS_SECRET_ARN=arn:aws:secretsmanager:...

# Storage (from CommunityStorage-dev outputs)
AWS_S3_PHOTOS_BUCKET=community-app-photos-dev-YOUR_ACCOUNT_ID
AWS_CLOUDFRONT_DOMAIN=xxx.cloudfront.net
```

## Step 12: Test Database Connection from Node

Create a test script `aws/migrations/test-connection.ts`:

```typescript
import { Client } from 'pg';
import * as AWS from '@aws-sdk/client-secrets-manager';

async function testConnection() {
  // Get database credentials from Secrets Manager
  const secretsManager = new AWS.SecretsManager({ region: 'us-east-1' });
  const secret = await secretsManager.getSecretValue({
    SecretId: 'community-db-credentials-dev',
  });
  
  const credentials = JSON.parse(secret.SecretString!);
  
  // Connect to database
  const client = new Client({
    host: process.env.AWS_RDS_ENDPOINT,
    port: 5432,
    database: 'community',
    user: credentials.username,
    password: credentials.password,
    ssl: { rejectUnauthorized: false },
  });
  
  await client.connect();
  console.log('✅ Connected to database!');
  
  // Test PostGIS
  const result = await client.query('SELECT PostGIS_version()');
  console.log('✅ PostGIS version:', result.rows[0].postgis_version);
  
  await client.end();
}

testConnection().catch(console.error);
```

Install dependencies:
```bash
cd aws/migrations
npm init -y
npm install pg @aws-sdk/client-secrets-manager
npm install --save-dev @types/pg tsx
```

Run it:
```bash
npx tsx test-connection.ts
```

## What's Next?

You now have:
- ✅ VPC with public/private subnets
- ✅ RDS PostgreSQL with PostGIS
- ✅ S3 bucket + CloudFront CDN
- ✅ Secure credential storage in Secrets Manager

**Next steps:**
1. Review `AWS-MIGRATION-PLAN.md` Phase 1.2 - Schema Migration
2. Create database schema in RDS
3. Start migrating your matching algorithm to Lambda (Phase 4)

## Useful Commands

```bash
# List all stacks
cdk list

# View stack details
cdk synth CommunityNetwork-dev

# See what would change
cdk diff CommunityNetwork-dev

# Deploy all stacks
cdk deploy --all

# Destroy a stack (careful!)
cdk destroy CommunityNetwork-dev

# View CloudFormation console
open https://console.aws.amazon.com/cloudformation
```

## Cost Tracking

Check your AWS costs daily:
```bash
# View current month's costs
aws ce get-cost-and-usage \
  --time-period Start=2025-11-01,End=2025-11-30 \
  --granularity MONTHLY \
  --metrics "BlendedCost" \
  --profile community-app
```

Set up billing alerts in AWS Console: https://console.aws.amazon.com/billing/home#/budgets

## Troubleshooting

### CDK Deploy Fails
```bash
# View detailed logs
cdk deploy CommunityNetwork-dev --verbose

# Check CloudFormation events
aws cloudformation describe-stack-events \
  --stack-name CommunityNetwork-dev \
  --max-items 20
```

### Can't Connect to Database
- Check security group allows your IP
- Verify database is in "Available" state (RDS console)
- Confirm you're using the correct endpoint and credentials

### CDK Bootstrap Issues
```bash
# Re-bootstrap if needed
cdk bootstrap aws://$CDK_DEFAULT_ACCOUNT/$CDK_DEFAULT_REGION --force
```

## Next: Read the Full Migration Plan

Open `AWS-MIGRATION-PLAN.md` and continue with Phase 1.2: Schema Migration

---

**Questions?** Check the AWS docs or ask for help!
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Free Tier](https://aws.amazon.com/free/)
- [r/aws on Reddit](https://reddit.com/r/aws)

