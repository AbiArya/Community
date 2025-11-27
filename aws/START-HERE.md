# 🚀 AWS Migration - START HERE

## ✅ Phase 0 Progress

- ✅ AWS CLI installed (2.28.23)
- ✅ AWS CDK installed (2.1033.0)
- ✅ Repository structure created
- ✅ Documentation prepared
- ⏳ **NEXT: Configure AWS credentials**

---

## Step 2: Configure AWS Account & Credentials

You need to create an AWS account and IAM user to deploy infrastructure.

### Option A: I already have an AWS account

Skip to **Step 2B** below.

### Option B: I need to create an AWS account

1. **Create AWS Account** (5 minutes)
   - Go to: https://aws.amazon.com/free/
   - Click "Create an AWS Account"
   - Follow the sign-up process
   - ⚠️ You'll need a credit card (free tier should cost $0-5/month)
   - **Important**: Enable MFA on your root account immediately!

2. **Set up billing alerts**
   - Go to: https://console.aws.amazon.com/billing/home#/budgets
   - Create budgets for $10, $50, $100
   - This protects you from unexpected charges

---

### Step 2B: Create IAM User (Required for everyone)

**Why?** Never use your AWS root account for day-to-day work. Create an IAM user instead.

1. **Log into AWS Console**: https://console.aws.amazon.com/

2. **Create IAM User**:
   - Navigate to IAM: https://console.aws.amazon.com/iam/
   - Click "Users" → "Create user"
   - User name: `community-app-deployer`
   - Click "Next"

3. **Set Permissions**:
   - Select "Attach policies directly"
   - Search and check: `AdministratorAccess`
   - ⚠️ This is for learning. In production, use more restrictive policies.
   - Click "Next" → "Create user"

4. **Create Access Keys**:
   - Click on your new user: `community-app-deployer`
   - Click "Security credentials" tab
   - Click "Create access key"
   - Select use case: "Command Line Interface (CLI)"
   - Check the acknowledgment box
   - Click "Next" → "Create access key"
   - **SAVE THESE IMMEDIATELY** (you can't view them again):
     * Access Key ID: `AKIA...`
     * Secret Access Key: `...`
   - Click "Download .csv file" for backup
   - Click "Done"

---

### Step 2C: Configure AWS CLI

Now configure your AWS CLI with the credentials:

```bash
aws configure --profile community-app
```

When prompted, enter:
- **AWS Access Key ID**: [paste from Step 2B]
- **AWS Secret Access Key**: [paste from Step 2B]
- **Default region name**: `us-east-1` (or `us-west-2` if closer to you)
- **Default output format**: `json`

**Test it works:**

```bash
aws sts get-caller-identity --profile community-app
```

You should see your Account ID and user ARN. **Note your Account ID!**

---

## Step 3: Run Automated Setup

Once AWS credentials are configured, run the setup script:

```bash
cd /Users/aarya/Desktop/community
./aws/scripts/setup-phase0.sh
```

This script will:
- ✅ Verify AWS CLI and CDK are installed
- ✅ Check AWS credentials are working
- ✅ Bootstrap CDK in your AWS account
- ✅ Install CDK dependencies
- ✅ Create environment configuration
- ✅ Set up shell environment variables
- ✅ Create git branch for migration

---

## Step 4: Manual Verification

After the script completes, verify everything:

```bash
# Check AWS authentication
aws sts get-caller-identity --profile community-app

# Check CDK
cdk --version

# Check environment variables (after running the script)
echo $AWS_PROFILE
echo $AWS_REGION

# Test CDK synthesis
cd aws/cdk
cdk synth CommunityNetwork-dev
```

All commands should work without errors.

---

## What's Next?

Once Phase 0 is complete, you'll be ready to deploy your first AWS infrastructure!

**Next:** Deploy your VPC and networking

```bash
cd aws/cdk
cdk deploy CommunityNetwork-dev
```

This will create:
- 1 VPC with public/private subnets
- NAT gateway for private subnet internet access
- Security groups for database access
- Takes ~5 minutes

**Then:** Follow `aws/QUICK-START.md` for Phase 1 (Database Migration)

---

## Troubleshooting

### "Cannot find profile community-app"

Run `aws configure --profile community-app` again and enter your credentials.

### "Access Denied" errors

Your IAM user may not have sufficient permissions. Verify `AdministratorAccess` policy is attached.

### CDK bootstrap fails

Make sure your AWS credentials are correct and you have permissions to create CloudFormation stacks.

### Need help?

- Check `aws/docs/PHASE-0-CHECKLIST.md` for detailed steps
- Read `AWS-MIGRATION-PLAN.md` for the full migration plan
- Review `aws/QUICK-START.md` for deployment guide

---

## Cost Warning ⚠️

During Phase 0, you won't incur any charges (we're not deploying yet).

Once you start deploying (Phase 1+):
- **Free Tier:** Most services are free for the first year
- **Expected cost:** $0-5/month during development
- **Production:** ~$60-80/month

**Set billing alerts before deploying!**

---

## Quick Reference

### Useful Commands

```bash
# AWS CLI
aws sts get-caller-identity --profile community-app  # Verify credentials
aws configure list-profiles                          # List all profiles

# AWS CDK
cdk list                                            # List all stacks
cdk synth <stack-name>                              # View CloudFormation template
cdk diff <stack-name>                               # Preview changes
cdk deploy <stack-name>                             # Deploy stack

# Project
git status                                          # Check git status
npm install                                         # Install dependencies
```

### Important Files

- `AWS-MIGRATION-PLAN.md` - Complete migration plan
- `aws/QUICK-START.md` - Step-by-step deployment guide
- `aws/docs/PHASE-0-CHECKLIST.md` - Detailed Phase 0 checklist
- `env.aws.template` - Environment variable template
- `aws/README.md` - AWS directory overview

---

**Ready?** Let's set up your AWS credentials and run the setup script! 🚀
