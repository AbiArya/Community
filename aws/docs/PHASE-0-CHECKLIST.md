# Phase 0: Preparation & Setup - Detailed Checklist

## 0.1: AWS Account Setup ✅

### Step 1: AWS Account
- [ ] Create AWS account at https://aws.amazon.com/free/
  - [ ] Enable MFA on root account
  - [ ] Set up billing alerts ($10, $50, $100)
  - [ ] Note your AWS Account ID: `____________`

### Step 2: IAM User Creation
- [ ] Navigate to IAM Console: https://console.aws.amazon.com/iam/
- [ ] Create new user: `community-app-deployer`
- [ ] Attach policy: `AdministratorAccess` (for learning)
- [ ] Create access keys for CLI
- [ ] Save Access Key ID: `____________`
- [ ] Save Secret Access Key: `____________` (secure location!)

### Step 3: Install AWS CLI
Check if already installed:
```bash
aws --version
```

**If not installed:**

macOS (Homebrew):
```bash
brew install awscli
```

macOS (Official):
```bash
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /
```

**Verify:**
```bash
aws --version  # Should show aws-cli/2.x.x
```

### Step 4: Configure AWS CLI
```bash
aws configure --profile community-app
# Enter Access Key ID
# Enter Secret Access Key
# Region: us-east-1 (or us-west-2)
# Output: json
```

**Test authentication:**
```bash
export AWS_PROFILE=community-app
aws sts get-caller-identity
# Should show your account ID and ARN
```

### Step 5: Install AWS CDK
```bash
npm install -g aws-cdk
cdk --version  # Should show 2.x.x
```

**Bootstrap CDK (one-time):**
```bash
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
export CDK_DEFAULT_REGION=us-east-1
cdk bootstrap aws://$CDK_DEFAULT_ACCOUNT/$CDK_DEFAULT_REGION
```

### Step 6: Add to Shell Profile
Add to `~/.zshrc` (macOS) or `~/.bash_profile` (Linux):
```bash
export AWS_PROFILE=community-app
export AWS_REGION=us-east-1
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
export CDK_DEFAULT_REGION=us-east-1
```

Reload:
```bash
source ~/.zshrc
```

---

## 0.2: Environment & Repository Setup ✅

### Step 1: Environment Files
- [x] Create `.env.aws.template` (reference for team)
- [ ] Copy to `.env.aws.local`:
  ```bash
  cp .env.aws.template .env.aws.local
  ```
- [ ] Fill in AWS_ACCOUNT_ID in `.env.aws.local`
- [ ] Verify `.gitignore` includes `.env*` ✅

### Step 2: CDK Dependencies
```bash
cd aws/cdk
npm install
```

**Expected packages:**
- aws-cdk-lib
- constructs
- @types/node
- typescript

### Step 3: Document Current State
- [x] Database schema documented in `aws/docs/database-schema-snapshot.md`
- [ ] Export Supabase data backup:
  ```bash
  # From Supabase dashboard, export:
  # - users table → CSV
  # - user_photos table → CSV
  # - hobbies table → CSV
  # - user_hobbies table → CSV
  # - matches table → CSV
  # Save in aws/migrations/backup-YYYY-MM-DD/
  ```

### Step 4: Verify Directory Structure
```
aws/
├── cdk/              ✅ CDK infrastructure code
│   ├── bin/
│   ├── lib/
│   └── package.json
├── lambdas/          ✅ Lambda function code
│   ├── auth/
│   ├── matching/
│   ├── websocket/
│   └── shared/
├── migrations/       ✅ Database migration scripts
├── docs/            ✅ Documentation
│   ├── database-schema-snapshot.md
│   └── PHASE-0-CHECKLIST.md
└── scripts/         🔲 Deployment scripts (create later)
```

---

## 0.3: Development Strategy ✅

### Step 1: Create Git Branch
```bash
# Make sure you're on main and up to date
git checkout main
git pull origin main

# Create migration branch
git checkout -b feature/aws-migration
```

### Step 2: Commit Phase 0 Setup
```bash
git add .gitignore
git add .env.aws.template
git add aws/docs/
git commit -m "Phase 0: AWS migration preparation complete

- Added AWS-specific .gitignore entries
- Created .env.aws.template for configuration
- Documented current database schema
- Added Phase 0 checklist
- Ready to begin Phase 1 (Database migration)"
```

### Step 3: Migration Strategy Decisions
- [x] **Region Selected**: us-east-1 (or us-west-2)
- [x] **Approach**: Dual-environment (Supabase stays live during migration)
- [x] **Testing**: Each phase validated before proceeding
- [x] **Rollback**: Can revert to Supabase at any point
- [x] **Cutover**: Planned for Phase 9 after all features working

---

## Phase 0 Validation ✅

### Test 1: AWS CLI Authentication
```bash
aws sts get-caller-identity --profile community-app
```
✅ Should show your Account ID and user ARN

### Test 2: AWS Region Access
```bash
aws ec2 describe-availability-zones --region $AWS_REGION
```
✅ Should list availability zones

### Test 3: CDK Synthesize
```bash
cd aws/cdk
cdk synth CommunityNetwork-dev
```
✅ Should generate CloudFormation template

### Test 4: Git Branch
```bash
git branch --show-current
```
✅ Should show: feature/aws-migration

### Test 5: Environment Variables
```bash
echo "Profile: $AWS_PROFILE"
echo "Region: $AWS_REGION"
echo "Account: $CDK_DEFAULT_ACCOUNT"
```
✅ All should be set correctly

---

## Phase 0 Complete! 🎉

**You have successfully:**
- ✅ Set up AWS account with IAM user
- ✅ Installed and configured AWS CLI
- ✅ Installed AWS CDK and bootstrapped
- ✅ Updated repository for AWS migration
- ✅ Documented current database schema
- ✅ Created migration branch
- ✅ Set up environment configuration

**Next Step:** Proceed to Phase 1 - Database Migration

📖 Read: `AWS-MIGRATION-PLAN.md` - Phase 1  
🚀 Follow: `aws/QUICK-START.md` - Steps 6-12

**Estimated time for Phase 1:** 2-3 hours

