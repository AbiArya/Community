# AWS Migration - Start Here

## You're Ready to Begin!

Everything is planned out in `../AWS-MIGRATION-PLAN.md`. Here's what to do:

### Right Now
1. Create AWS account (if you don't have one)
2. Install CDK: `npm install -g aws-cdk`
3. Configure AWS CLI: `aws configure --profile community-app`

### Then Start Phase 1
- Set up RDS PostgreSQL database
- Install PostGIS extension
- Migrate your schema from Supabase
- Create database connection utilities

### Key Decisions Already Made ✅
- **Messaging:** Redis Pub/Sub (not AppSync) - better for learning
- **Cron:** EventBridge triggers Lambda every Monday 3 AM UTC
- **Repo:** Mono-repo (keep everything together)
- **Cost:** ~$0-5/month during development (free tier)

### Migration Order
1. Database (Phase 1) ← Start here
2. Storage (Phase 2)
3. Lambda + Cron (Phase 4)
4. Auth (Phase 3)
5. Real-time (Phase 5)

Full plan: `../AWS-MIGRATION-PLAN.md`

Let's build! 🚀

