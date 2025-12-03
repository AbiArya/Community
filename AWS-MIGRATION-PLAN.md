# AWS Infrastructure Reference

This document tracks AWS resources deployed to support the Community Friends App.
For the main development roadmap, see `workplan.md`.

---

## 📦 Deployed Resources

| Resource | Name/ID | Supports |
|----------|---------|----------|
| VPC | `vpc-0c45aa7745bbe6095` | Network isolation |
| S3 Bucket | `community-app-photos-dev-879381267216` | Phase 4 (Photos) |
| CloudFront | `d2rld0uk0j0fpj.cloudfront.net` | Phase 4 (Photo CDN) |
| Lambda | `community-match-generation-dev` | Phase 6.1 (Matching) |
| EventBridge | `community-weekly-match-generation-dev` | Phase 6.1 (Mon 3AM UTC cron) |
| Secret | `community-app/supabase-dev` | Lambda credentials |

**Monthly Cost:** $0 (AWS Free Tier)

---

## 🔧 Quick Commands

```bash
# Test Lambda (generates matches for all users)
aws lambda invoke \
  --function-name community-match-generation-dev \
  --profile community-app \
  output.json && cat output.json

# View Lambda logs
aws logs tail /aws/lambda/community-match-generation-dev \
  --profile community-app --follow

# Deploy CDK changes
cd aws/cdk && cdk deploy --all --profile community-app

# List deployed stacks
aws cloudformation list-stacks \
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
  --profile community-app \
  --query "StackSummaries[?contains(StackName,'Community')].StackName"
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Community Friends App                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐         ┌─────────────────────────────┐   │
│  │   Vercel    │         │        AWS ($0/month)       │   │
│  │  (Next.js)  │         │                             │   │
│  │             │────────▶│  S3 + CloudFront (photos)   │   │
│  │             │         │  Lambda (match generation)  │   │
│  │             │         │  EventBridge (weekly cron)  │   │
│  └─────────────┘         └─────────────────────────────┘   │
│         │                         │                         │
│         ▼                         ▼                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Supabase (Free Tier)                   │   │
│  │  • PostgreSQL + PostGIS                             │   │
│  │  • Auth (magic links)                               │   │
│  │  • Realtime (for Phase 6.3 messaging)               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 AWS Code Structure

```
aws/
├── cdk/                        # Infrastructure as Code
│   ├── lib/
│   │   ├── network-stack.ts    # VPC, subnets
│   │   ├── storage-stack.ts    # S3 + CloudFront  
│   │   ├── matching-stack.ts   # Lambda + EventBridge
│   │   └── database-stack.ts   # (not deployed - using Supabase)
│   └── bin/community-app.ts
├── lambdas/
│   ├── matching/
│   │   └── generate-matches.ts # Weekly match generation
│   └── shared/
│       └── supabase-client.ts  # Secrets Manager integration
└── docs/
    └── database-schema-snapshot.md
```

---

## 🔐 Environment Variables

Add to `.env.local` for S3 photo uploads:

```bash
AWS_S3_PHOTOS_BUCKET=community-app-photos-dev-879381267216
AWS_CLOUDFRONT_DOMAIN=d2rld0uk0j0fpj.cloudfront.net
AWS_REGION=us-east-1
AWS_PROFILE=community-app
```

---

## 🔜 Future AWS Work (Optional)

These can be added later if needed:

| Feature | AWS Service | When |
|---------|-------------|------|
| CloudWatch dashboards | CloudWatch | Phase 7 (Testing) |
| Real-time messaging | ElastiCache Redis | Phase 6.3 (or use Supabase Realtime) |
| Image optimization | Lambda@Edge | Future |
| Full database migration | RDS PostgreSQL | Future |
| Full auth migration | Cognito | Future |

---

## 📚 Reference

- [AWS CDK Docs](https://docs.aws.amazon.com/cdk/)
- [Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [S3 Pricing](https://aws.amazon.com/s3/pricing/) (5GB free)

---

*Last Updated: 2025-12-03*
