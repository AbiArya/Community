# 💰 Zero-Cost AWS Learning Guide

**Goal:** Learn AWS while spending $0/month by continuing to use Supabase for database and auth.

---

## ✅ Recommended Setup (Total: $0/month)

### What to Deploy

| Stack | Command | Cost | What You'll Learn |
|-------|---------|------|-------------------|
| Network | `cdk deploy CommunityNetwork-dev` | **$0** | VPC, Subnets, Security Groups |
| Storage | `cdk deploy CommunityStorage-dev` | **$0** | S3, CloudFront CDN |

### What to Skip

| Stack | Why Skip | Alternative |
|-------|----------|-------------|
| Database | ~$15/month after free tier | **Keep using Supabase** |
| Cognito Auth | Complexity, not needed yet | **Keep using Supabase Auth** |
| Redis | ~$12/month | Use Supabase Realtime |

---

## 🚀 Deployment Commands

### Step 1: Deploy Network (Free)

```bash
cd aws/cdk
cdk deploy CommunityNetwork-dev
```

This creates:
- VPC with public subnets
- Security groups
- **NO NAT Gateway** (saves $32/month!)

Cost: **$0/month**

### Step 2: Deploy Storage (Free)

```bash
cdk deploy CommunityStorage-dev
```

This creates:
- S3 bucket for photos
- CloudFront CDN

Cost: **$0/month** (free tier: 5GB storage, 50GB transfer)

### Step 3: That's It!

You now have real AWS infrastructure to learn from, while your app continues using Supabase for the database.

---

## 🎓 What You'll Learn

Even without deploying the database, you'll learn:

### From Network Stack
- ✅ VPC architecture
- ✅ Subnet configuration (public vs private)
- ✅ Security groups and ingress rules
- ✅ AWS networking fundamentals

### From Storage Stack
- ✅ S3 bucket configuration
- ✅ CloudFront CDN setup
- ✅ Origin Access Identity (OAI)
- ✅ Presigned URLs for secure uploads
- ✅ CORS configuration

### From CDK
- ✅ Infrastructure as Code
- ✅ TypeScript for infrastructure
- ✅ Stack dependencies
- ✅ CloudFormation under the hood

---

## 📊 Cost Comparison

| Approach | Monthly Cost | Learning Value |
|----------|-------------|----------------|
| **Zero-Cost (Recommended)** | $0 | High - core AWS concepts |
| Full Dev Stack | ~$47 | High - all services |
| Production Stack | ~$80+ | Maximum - production patterns |

### Full Stack Breakdown (If You Want It Later)

| Service | Dev Cost | Free Tier |
|---------|----------|-----------|
| NAT Gateway | $32/mo | ❌ Never free |
| RDS db.t4g.micro | $12/mo | ✅ 12 months |
| S3 + CloudFront | $0-5/mo | ✅ 12 months |
| Lambda | $0 | ✅ Always free (1M/mo) |
| API Gateway | $0 | ✅ 12 months (1M/mo) |
| Redis | $12/mo | ❌ No free tier |

---

## 🔄 Hybrid Architecture

Your app will work like this:

```
┌─────────────────────────────────────────────────────┐
│                    Your App                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────┐         ┌─────────────────────┐   │
│  │   Vercel    │         │   AWS (Free)        │   │
│  │  Next.js    │         │                     │   │
│  │  Frontend   │────────▶│  S3 + CloudFront    │   │
│  └─────────────┘         │  (Photo Storage)    │   │
│         │                └─────────────────────┘   │
│         │                                          │
│         ▼                                          │
│  ┌─────────────────────────────────────────────┐   │
│  │           Supabase (Free Tier)              │   │
│  │                                             │   │
│  │  • PostgreSQL Database                      │   │
│  │  • Authentication (Magic Links)             │   │
│  │  • Realtime (for messaging later)           │   │
│  │  • Row Level Security                       │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🗓️ Migration Path (When Ready)

When you're ready to go full AWS (maybe for production):

### Phase 1: Now (Free)
- ✅ Deploy Network + Storage
- ✅ Keep using Supabase

### Phase 2: Later (When Needed)
- 🔜 Deploy RDS when free tier available
- 🔜 Migrate database schema
- 🔜 Update connection strings

### Phase 3: Production (When Revenue)
- 🔜 Add NAT Gateway for security
- 🔜 Enable Multi-AZ for reliability
- 🔜 Add Cognito for auth
- 🔜 Add Redis for messaging

---

## 🛑 What NOT to Deploy (Saves Money)

```bash
# DON'T run these yet:
# cdk deploy CommunityDatabase-dev    # ~$15/month after free tier
# cdk deploy CommunityNetwork-prod    # $32/month NAT gateway
```

---

## 📝 Quick Reference

### Deploy (Free)
```bash
cd aws/cdk
cdk deploy CommunityNetwork-dev   # Free
cdk deploy CommunityStorage-dev   # Free
```

### Check What's Deployed
```bash
cdk list                          # List all stacks
aws cloudformation list-stacks    # See deployed stacks
```

### Clean Up (If Needed)
```bash
cdk destroy CommunityStorage-dev  # Remove storage
cdk destroy CommunityNetwork-dev  # Remove network
```

### Check Costs
- AWS Console: https://console.aws.amazon.com/cost-management/
- Set alerts: https://console.aws.amazon.com/billing/home#/budgets

---

## ✅ Your Action Plan

1. **Complete Phase 0** (AWS credentials setup)
2. **Deploy Network stack** - `cdk deploy CommunityNetwork-dev`
3. **Deploy Storage stack** - `cdk deploy CommunityStorage-dev`
4. **Skip Database stack** - Continue using Supabase
5. **Explore AWS Console** - See what you created
6. **Learn Lambda later** - Deploy serverless functions when ready

**Total monthly cost: $0** 🎉

---

## 🆘 If You Accidentally Deploy Database

No worries! Just destroy it:

```bash
cdk destroy CommunityDatabase-dev
```

This will remove the RDS instance and stop any charges.

---

## 📚 Further Learning

Even with free tier, you can learn:

1. **S3 Photo Upload** - Modify PhotoUpload component to use S3
2. **CloudFront** - Serve photos through CDN
3. **Lambda** - Create serverless functions (1M free/month!)
4. **API Gateway** - Build REST APIs (1M free/month!)
5. **VPC** - Understand networking from console

All without paying anything extra!

