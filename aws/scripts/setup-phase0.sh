#!/bin/bash

# Phase 0 Setup Script
# Helps automate the initial AWS migration setup

set -e  # Exit on error

echo "========================================"
echo "Phase 0: AWS Migration Setup"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if AWS CLI is installed
echo "Checking AWS CLI installation..."
if ! command -v aws &> /dev/null; then
    echo -e "${RED}✗ AWS CLI not found${NC}"
    echo ""
    echo "Install AWS CLI:"
    echo "  macOS (Homebrew): brew install awscli"
    echo "  macOS (Official): curl \"https://awscli.amazonaws.com/AWSCLIV2.pkg\" -o \"AWSCLIV2.pkg\" && sudo installer -pkg AWSCLIV2.pkg -target /"
    echo ""
    exit 1
else
    AWS_VERSION=$(aws --version)
    echo -e "${GREEN}✓ AWS CLI installed: $AWS_VERSION${NC}"
fi

# Check if AWS CDK is installed
echo "Checking AWS CDK installation..."
if ! command -v cdk &> /dev/null; then
    echo -e "${YELLOW}! AWS CDK not found${NC}"
    echo "Installing AWS CDK globally..."
    npm install -g aws-cdk
    echo -e "${GREEN}✓ AWS CDK installed${NC}"
else
    CDK_VERSION=$(cdk --version)
    echo -e "${GREEN}✓ AWS CDK installed: $CDK_VERSION${NC}"
fi

# Check AWS credentials
echo ""
echo "Checking AWS credentials..."
if aws sts get-caller-identity --profile community-app &> /dev/null; then
    ACCOUNT_ID=$(aws sts get-caller-identity --profile community-app --query Account --output text)
    USER_ARN=$(aws sts get-caller-identity --profile community-app --query Arn --output text)
    echo -e "${GREEN}✓ AWS credentials configured${NC}"
    echo "  Account ID: $ACCOUNT_ID"
    echo "  User: $USER_ARN"
else
    echo -e "${RED}✗ AWS credentials not configured${NC}"
    echo ""
    echo "Run: aws configure --profile community-app"
    echo "You'll need:"
    echo "  - AWS Access Key ID"
    echo "  - AWS Secret Access Key"
    echo "  - Default region (recommend: us-east-1)"
    echo "  - Default output format: json"
    echo ""
    exit 1
fi

# Create .env.aws.local if it doesn't exist
echo ""
echo "Setting up environment file..."
if [ ! -f .env.aws.local ]; then
    if [ -f env.aws.template ]; then
        cp env.aws.template .env.aws.local
        # Replace account ID in the file
        sed -i.bak "s/YOUR_ACCOUNT_ID_HERE/$ACCOUNT_ID/g" .env.aws.local
        rm .env.aws.local.bak 2>/dev/null || true
        echo -e "${GREEN}✓ Created .env.aws.local${NC}"
    else
        echo -e "${YELLOW}! env.aws.template not found, skipping${NC}"
    fi
else
    echo -e "${YELLOW}! .env.aws.local already exists, skipping${NC}"
fi

# Add environment variables to shell profile
echo ""
echo "Checking shell profile..."
SHELL_PROFILE=""
if [ -f ~/.zshrc ]; then
    SHELL_PROFILE=~/.zshrc
elif [ -f ~/.bash_profile ]; then
    SHELL_PROFILE=~/.bash_profile
elif [ -f ~/.bashrc ]; then
    SHELL_PROFILE=~/.bashrc
fi

if [ -n "$SHELL_PROFILE" ]; then
    if ! grep -q "AWS_PROFILE=community-app" "$SHELL_PROFILE"; then
        echo ""
        echo "# AWS Community App Configuration" >> "$SHELL_PROFILE"
        echo "export AWS_PROFILE=community-app" >> "$SHELL_PROFILE"
        echo "export AWS_REGION=us-east-1" >> "$SHELL_PROFILE"
        echo "export CDK_DEFAULT_ACCOUNT=\$(aws sts get-caller-identity --query Account --output text 2>/dev/null)" >> "$SHELL_PROFILE"
        echo "export CDK_DEFAULT_REGION=us-east-1" >> "$SHELL_PROFILE"
        echo -e "${GREEN}✓ Added AWS environment variables to $SHELL_PROFILE${NC}"
        echo -e "${YELLOW}! Run: source $SHELL_PROFILE${NC}"
    else
        echo -e "${GREEN}✓ AWS environment variables already in $SHELL_PROFILE${NC}"
    fi
fi

# Export for current session
export AWS_PROFILE=community-app
export AWS_REGION=us-east-1
export CDK_DEFAULT_ACCOUNT=$ACCOUNT_ID
export CDK_DEFAULT_REGION=us-east-1

# Check if CDK is bootstrapped
echo ""
echo "Checking CDK bootstrap status..."
if aws cloudformation describe-stacks --stack-name CDKToolkit --region us-east-1 &> /dev/null; then
    echo -e "${GREEN}✓ CDK already bootstrapped${NC}"
else
    echo -e "${YELLOW}! CDK not bootstrapped${NC}"
    echo "Bootstrapping CDK..."
    cdk bootstrap aws://$ACCOUNT_ID/us-east-1
    echo -e "${GREEN}✓ CDK bootstrapped${NC}"
fi

# Install CDK dependencies
echo ""
echo "Installing CDK dependencies..."
cd aws/cdk
if [ ! -d node_modules ]; then
    npm install
    echo -e "${GREEN}✓ CDK dependencies installed${NC}"
else
    echo -e "${GREEN}✓ CDK dependencies already installed${NC}"
fi
cd ../..

# Test CDK synth
echo ""
echo "Testing CDK synthesis..."
cd aws/cdk
if cdk synth CommunityNetwork-dev > /dev/null; then
    echo -e "${GREEN}✓ CDK synthesis successful${NC}"
else
    echo -e "${RED}✗ CDK synthesis failed${NC}"
    exit 1
fi
cd ../..

# Check git branch
echo ""
echo "Checking git branch..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "feature/aws-migration" ]; then
    echo -e "${GREEN}✓ On migration branch: $CURRENT_BRANCH${NC}"
elif [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
    echo -e "${YELLOW}! On main branch${NC}"
    read -p "Create feature/aws-migration branch? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout -b feature/aws-migration
        echo -e "${GREEN}✓ Created and switched to feature/aws-migration${NC}"
    fi
else
    echo -e "${YELLOW}! On branch: $CURRENT_BRANCH${NC}"
fi

echo ""
echo "========================================"
echo -e "${GREEN}Phase 0 Setup Complete! 🎉${NC}"
echo "========================================"
echo ""
echo "Summary:"
echo "  ✓ AWS CLI configured"
echo "  ✓ AWS CDK installed and bootstrapped"
echo "  ✓ Environment files created"
echo "  ✓ CDK dependencies installed"
echo "  ✓ Infrastructure code ready"
echo ""
echo "Next Steps:"
echo "  1. Review aws/docs/PHASE-0-CHECKLIST.md"
echo "  2. Read AWS-MIGRATION-PLAN.md Phase 1"
echo "  3. Deploy first stack: cd aws/cdk && cdk deploy CommunityNetwork-dev"
echo ""
echo "Useful commands:"
echo "  cdk list                    # List all stacks"
echo "  cdk synth <stack>          # View CloudFormation template"
echo "  cdk diff <stack>           # See what would change"
echo "  cdk deploy <stack>         # Deploy a stack"
echo ""

