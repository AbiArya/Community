# AWS Migration Action Plan
## From Supabase to AWS - Hybrid Migration

**Status:** 🚀 In Progress - Phase 4 (Lambda Functions)

---

## ✅ Migration Progress

```
Phase 0: Preparation       [████████████████████████████] 100% ✅ COMPLETE
Phase 1: Database (RDS)    [░░░░░░░░░░░░░░░░░░░░░░░░░░░░] SKIPPED (using Supabase)
Phase 2: Storage (S3)      [████████████████████████████] 100% ✅ COMPLETE
Phase 3: Auth (Cognito)    [░░░░░░░░░░░░░░░░░░░░░░░░░░░░] SKIPPED (using Supabase Auth)
Phase 4: Lambda + API      [████████████████████████████] 100% ✅ COMPLETE
Phase 5: Messaging (Redis) [░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Future
Phase 6: Deployment        [░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Future
Phase 7: Monitoring        [░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Future
Phase 8: Security          [░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Future
Phase 9: Cutover           [░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Future
```

**Current Status:** Phase 4 COMPLETE - Lambda + EventBridge deployed and tested
**Next Action:** Phase 5 (Messaging with Redis) or Phase 7 (Monitoring)

### 🎯 Hybrid Approach (Zero Cost Learning)
We're keeping **Supabase for database and auth** while learning AWS with:
- ✅ VPC networking (deployed)
- ✅ S3 + CloudFront for photos (deployed, integration pending)
- 🔜 Lambda for serverless functions
- 🔜 EventBridge for cron jobs

**Monthly Cost:** $0 (free tier)

---

## 📋 Executive Summary

This plan migrates your friend-matching app from Supabase to AWS infrastructure using a **hybrid approach** - keeping Supabase for database/auth while learning AWS services.

**Current Setup (Keeping):**
- ✅ PostgreSQL Database (Supabase - free tier)
- ✅ Email Magic Link Authentication (Supabase Auth)
- ✅ Row Level Security (RLS) policies
- ✅ Stored database functions (PostGIS queries)

**AWS Services (Deployed/Learning):**
- ✅ VPC networking (deployed)
- ✅ S3 + CloudFront for photo storage (deployed & integrated)
- 🔜 Lambda for serverless compute (Phase 4)
- 🔜 EventBridge for cron jobs (Phase 4)
- 🔜 CloudWatch for monitoring (Phase 7)

**Future (Full Migration - When Ready):**
- RDS PostgreSQL with PostGIS
- Cognito for authentication
- ElastiCache Redis + WebSockets for real-time messaging

---

## 🎯 Migration Phases

### Phase 0: Preparation & Setup ✅ COMPLETE
**Timeline:** Week 1  
**Risk:** Low  
**Status:** ✅ Complete (December 3, 2025)

#### 0.1: AWS Account Setup ✅
- [x] Create AWS account
- [x] Set up billing alerts
- [x] Create IAM admin user (not root)
- [x] Install AWS CLI v2 ✅ v2.28.23
- [x] Configure AWS CLI with profile: `aws configure --profile community-app`
- [x] Install AWS CDK ✅ v2.1033.0
- [x] Bootstrap CDK in AWS account

#### 0.2: Environment & Repository Setup ✅
- [x] Create `env.aws.template` for AWS credentials
- [x] Update `.gitignore` to include AWS-specific files
- [x] Create `aws/` directory structure
- [x] Document current database schema snapshot

#### 0.3: Development Strategy ✅
- [x] Create git branch: `feature/aws-migration`
- [x] Set up AWS region: `us-east-1`
- [x] Plan dual-environment strategy (Supabase stays live)
- [x] Implement zero-cost mode for development

#### 0.4: Initial Deployments ✅
- [x] Deploy `CommunityNetwork-dev` (VPC, subnets, security groups)
- [x] Deploy `CommunityStorage-dev` (S3 bucket, CloudFront CDN)

**Deployed Resources:**
- VPC: `vpc-0c45aa7745bbe6095`
- S3 Bucket: `community-app-photos-dev-879381267216`
- CloudFront: `d2rld0uk0j0fpj.cloudfront.net`

**Validation:** ✅ All passing
- [x] Can authenticate to AWS CLI
- [x] CDK bootstrap complete
- [x] CloudFormation stacks deployed successfully
- [x] S3 upload/download working
- [x] CloudFront serving content

---

### Phase 1: Database Migration 🗄️ ⏭️ SKIPPED
**Timeline:** Week 2-3  
**Risk:** Medium  
**Status:** ⏭️ SKIPPED - Continuing to use Supabase PostgreSQL

> **Decision:** We're keeping Supabase for the database to minimize costs during learning.
> This can be revisited later when ready for full AWS migration.
> 
> **Current Setup:** Supabase PostgreSQL with PostGIS (free tier)
> **Monthly Cost Savings:** ~$15/month by skipping RDS

#### 1.1: Set Up RDS PostgreSQL
- [ ] Create VPC with public/private subnets
  ```
  VPC: 10.0.0.0/16
  - Public Subnets: 10.0.1.0/24, 10.0.2.0/24
  - Private Subnets: 10.0.10.0/24, 10.0.11.0/24
  ```
- [ ] Create RDS subnet group (private subnets)
- [ ] Create security group for RDS (port 5432)
- [ ] Launch RDS PostgreSQL 15+ instance
  - Instance class: `db.t4g.micro` (free tier eligible)
  - Storage: 20GB gp3
  - Multi-AZ: No (dev), Yes (prod)
  - Enable automated backups (7 days)
- [ ] Install PostGIS extension: `CREATE EXTENSION postgis;`
- [ ] Enable connection from bastion host or local IP

**Files to create:**
- `aws/cdk/lib/database-stack.ts` - RDS infrastructure
- `aws/migrations/migrate-from-supabase.ts` - Migration script

#### 1.2: Schema Migration
- [ ] Export Supabase schema: 
  ```bash
  # Use Supabase dashboard or CLI
  npx supabase db dump --schema-only > supabase-schema.sql
  ```
- [ ] Review and clean schema (remove Supabase-specific features)
- [ ] Create AWS-compatible schema in `aws/migrations/schema.sql`
- [ ] Run schema against AWS RDS
- [ ] Migrate database functions from `supabase/migrations/`:
  - `202411240001_create_matching_functions.sql`
  - `202411240002_fix_round_function.sql`
  - `202411231200_add_user_location_trigger.sql`

#### 1.3: Data Migration
- [ ] Create data export script: `aws/migrations/export-supabase-data.ts`
- [ ] Export users table
- [ ] Export user_photos table
- [ ] Export hobbies table
- [ ] Export user_hobbies table
- [ ] Export matches table
- [ ] Import data to RDS using `pg_restore` or custom script
- [ ] Validate row counts match
- [ ] Verify PostGIS location_point data

#### 1.4: Database Access Layer
- [ ] Create `src/lib/aws/database.ts` (connection utility)
- [ ] Install `pg` package: `npm install pg`
- [ ] Create connection pool configuration
- [ ] Implement connection string from AWS Secrets Manager
- [ ] Create database client factory function
- [ ] Test basic CRUD operations

**Files to modify:**
- `src/lib/matching/database.ts` - Update to use AWS RDS client
- Create new: `src/lib/aws/database.ts`

**Environment Variables:**
```bash
# Add to .env.local and .env.aws
AWS_REGION=us-east-1
AWS_RDS_ENDPOINT=your-db.cluster-xxx.region.rds.amazonaws.com
AWS_RDS_DATABASE=community
AWS_RDS_SECRET_ARN=arn:aws:secretsmanager:...
```

**Validation:**
- [ ] Can connect to RDS from local environment
- [ ] PostGIS functions working (`ST_Distance`, etc.)
- [ ] All tables created with correct schema
- [ ] Sample data query returns expected results
- [ ] No data loss in migration

---

### Phase 2: Storage Migration (S3) 📁 ✅ COMPLETE
**Timeline:** Week 3-4  
**Risk:** Low  
**Dependencies:** Phase 0 ✅  
**Status:** ✅ Complete (December 3, 2025)

#### 2.1: S3 Bucket Setup ✅ COMPLETE
- [x] Create S3 bucket: `community-app-photos-dev-879381267216`
- [x] Configure bucket policy (private by default)
- [x] Set up lifecycle rules
- [x] Create CloudFront distribution: `d2rld0uk0j0fpj.cloudfront.net`
  - Origin: S3 bucket with OAI
  - Cache policy: Optimized for images
  - HTTPS enabled
- [x] Configure CORS for browser uploads
- [x] Test upload working via CLI

**CDK Stack:**
```typescript
// aws/cdk/lib/storage-stack.ts
const photoBucket = new s3.Bucket(this, 'PhotoBucket', {
  versioned: true,
  encryption: s3.BucketEncryption.S3_MANAGED,
  cors: [/* ... */],
  lifecycleRules: [/* ... */]
});

const distribution = new cloudfront.Distribution(this, 'PhotoCDN', {
  defaultBehavior: {
    origin: new origins.S3Origin(photoBucket),
    cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
  }
});
```

#### 2.2: Upload Utilities ✅ COMPLETE
- [x] Create `src/lib/aws/storage.ts` - Server-side S3 utilities
- [x] Create `src/lib/aws/storage-client.ts` - Client-side upload utilities
- [x] Install AWS SDK: `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
- [x] Implement presigned URL generation for uploads
- [x] Create API routes:
  - `src/app/api/photos/presigned-url/route.ts` - Generate upload URLs
  - `src/app/api/photos/delete/route.ts` - Delete photos from S3
- [ ] Create image optimization Lambda (optional - future enhancement)
  - Trigger: S3 event on upload
  - Process: Resize and optimize images
  - Output: Create thumbnails

**Files Created:**
- `src/lib/aws/storage.ts` - Server-side S3 client and utilities
- `src/lib/aws/storage-client.ts` - Client-side upload utilities
- `src/app/api/photos/presigned-url/route.ts` - Presigned URL generation
- `src/app/api/photos/delete/route.ts` - S3 delete endpoint

#### 2.3: Update Photo Components ✅ COMPLETE
- [x] Update `src/components/profile/ProfileEdit.tsx`
  - Added S3 upload support with presigned URLs
  - Maintains backward compatibility with Supabase storage
  - S3 is enabled when `AWS_S3_PHOTOS_BUCKET` is set
  - Delete handles both S3 and Supabase storage paths
- [x] Database continues to use `user_photos` table (Supabase)
  - `photo_url` stores CloudFront URL (for S3) or Supabase URL
  - `storage_path` stores S3 key (format: `photos/{userId}/...`) or Supabase path

**Note:** PhotoUpload.tsx and PhotoManagement.tsx unchanged - they handle UI only.
The actual upload/delete logic is in ProfileEdit.tsx and ProfileWizard.tsx.

**Environment Variables:**
```bash
# Add to .env.local for S3 integration
AWS_S3_PHOTOS_BUCKET=community-app-photos-dev-879381267216
AWS_CLOUDFRONT_DOMAIN=d2rld0uk0j0fpj.cloudfront.net
AWS_REGION=us-east-1
AWS_PROFILE=community-app
```

**Validation:**
- [x] Can upload photo to S3 ✅
- [x] Presigned URLs working ✅
- [x] Photos display via CloudFront ✅
- [x] Delete removes from S3 ✅
- [x] Database tracks S3 keys correctly ✅

---

### Phase 3: Authentication Migration (Cognito) 🔐 ⏭️ SKIPPED
**Timeline:** Week 4-6  
**Risk:** HIGH ⚠️  
**Status:** ⏭️ SKIPPED - Continuing to use Supabase Auth

> **Decision:** We're keeping Supabase Auth to minimize complexity during learning.
> Magic link auth works well with Supabase. Cognito doesn't support magic links natively.
> 
> **Current Setup:** Supabase Auth with email magic links (free tier)
> **Complexity Savings:** Avoiding custom Lambda auth implementation

#### 3.1: Cognito Setup
- [ ] Create Cognito User Pool
  - Username: Email
  - Password policy: Match current requirements
  - MFA: Optional
  - Email verification: Required
- [ ] Configure email provider
  - Option A: Cognito's built-in (limited)
  - Option B: SES for production
- [ ] Create User Pool Client (for Next.js app)
- [ ] Set up OAuth flows (if needed)
- [ ] Configure custom domain (optional): `auth.yourdomain.com`

**CDK Stack:**
```typescript
// aws/cdk/lib/auth-stack.ts
const userPool = new cognito.UserPool(this, 'UserPool', {
  signInAliases: { email: true },
  selfSignUpEnabled: true,
  passwordPolicy: { /* ... */ },
  email: cognito.UserPoolEmail.withSES(/* ... */),
});

const client = userPool.addClient('AppClient', {
  authFlows: {
    userPassword: true,
    userSrp: true,
  },
  oAuth: {
    flows: { authorizationCodeGrant: true },
    callbackUrls: ['http://localhost:3000/auth/callback']
  }
});
```

#### 3.2: Magic Link Alternative
**Note:** Cognito doesn't have native magic link support. Options:

**Option A: Custom Lambda Auth (Recommended for learning)**
- [ ] Create Lambda function for passwordless auth
- [ ] Store verification codes in DynamoDB with TTL
- [ ] Send email with verification link via SES
- [ ] Lambda validates code and issues JWT

**Files to create:**
- `aws/lambdas/auth/send-magic-link.ts`
- `aws/lambdas/auth/verify-magic-link.ts`
- `aws/cdk/lib/auth-custom-stack.ts`

**Option B: Use Cognito password auth**
- [ ] Generate random temporary passwords
- [ ] Force password change on first login
- [ ] Use email verification flow

**Option C: Integrate third-party (Auth0, WorkOS)**
- Not using AWS, defeats learning purpose

#### 3.3: Update Auth Layer
- [ ] Install dependencies:
  ```bash
  npm install @aws-sdk/client-cognito-identity-provider
  npm install amazon-cognito-identity-js
  npm install aws-jwt-verify
  ```
- [ ] Create `src/lib/aws/auth.ts`
  - Sign up function
  - Sign in function (email + code)
  - Sign out function
  - Session management
  - Token refresh logic
- [ ] Replace `src/lib/supabase/client.ts` auth calls
- [ ] Update `src/hooks/useAuthSession.tsx`
  - Use Cognito session instead of Supabase
  - Update context to use AWS tokens

**Files to modify:**
- `src/lib/supabase/client.ts` → `src/lib/aws/auth.ts` (new)
- `src/hooks/useAuthSession.tsx` - Major refactor
- `src/components/auth/EmailAuthForm.tsx` - Update to Cognito API

#### 3.4: User Migration Strategy
**Critical:** Don't lose existing users!

**Strategy: Lazy Migration**
- [ ] Keep Supabase Auth active temporarily
- [ ] On user login to Supabase:
  - Create corresponding Cognito user
  - Migrate user attributes
  - Email user about migration
- [ ] Set cutoff date (e.g., 30 days)
- [ ] After cutoff, disable Supabase Auth

**Files to create:**
- `src/lib/migration/auth-migrator.ts`
- `aws/lambdas/auth/migrate-user.ts`

**Alternative: Bulk Migration**
- [ ] Export all Supabase users
- [ ] Import to Cognito (users must reset password)
- [ ] Send migration notification emails
- [ ] Switch over on specific date

**Environment Variables:**
```bash
AWS_COGNITO_USER_POOL_ID=us-east-1_xxxxx
AWS_COGNITO_CLIENT_ID=xxxxx
AWS_COGNITO_REGION=us-east-1
```

**Validation:**
- [ ] Can sign up new user
- [ ] Can sign in existing user
- [ ] Session persists correctly
- [ ] Token refresh works
- [ ] Sign out clears session
- [ ] Protected routes still work

---

### Phase 4: API Routes to Lambda 🚀 ✅ COMPLETE
**Timeline:** Week 6-7  
**Risk:** Medium  
**Dependencies:** Phase 2 ✅  
**Status:** ✅ Complete (December 3, 2025)
**Can Rollback:** Yes

> **Note:** Since we're keeping Supabase for database, Lambda functions will 
> connect to Supabase instead of RDS. This simplifies the implementation!

#### 4.1: Lambda Functions Infrastructure ✅ COMPLETE
- [x] Create Lambda execution role with permissions:
  - CloudWatch Logs ✅
  - Secrets Manager ✅
- [x] NodejsFunction bundles dependencies automatically with esbuild
- [x] Created shared Supabase client with Secrets Manager integration

**Files created:**
- `aws/lambdas/shared/supabase-client.ts` - Shared Supabase client with Secrets Manager
- `aws/lambdas/shared/package.json` - Shared dependencies
- `aws/lambdas/shared/tsconfig.json` - TypeScript config

#### 4.2: Migrate Match Generation API ✅ COMPLETE
**Current:** `src/app/api/matches/batch-generate/route.ts` (Next.js API route)  
**Target:** Lambda function triggered by EventBridge

- [x] Create `aws/lambdas/matching/generate-matches.ts`
- [x] Port logic from `src/lib/matching/algorithm.ts` and `database.ts`
- [x] Update database calls to use Supabase via Secrets Manager
- [x] Create EventBridge rule for cron (every Monday 3 AM UTC)
- [x] Create CDK stack with NodejsFunction (auto-bundles TypeScript)

**Files created:**
- `aws/lambdas/matching/generate-matches.ts` - Lambda handler with matching logic
- `aws/lambdas/matching/package.json` - Lambda dependencies
- `aws/lambdas/matching/tsconfig.json` - TypeScript config
- `aws/cdk/lib/matching-stack.ts` - CDK stack for Lambda + EventBridge

#### 4.3: Deploy Lambda Stack ✅ COMPLETE
**Deployed December 3, 2025**

**Deployed Resources:**
| Resource | ID |
|----------|-----|
| Lambda Function | `community-match-generation-dev` |
| EventBridge Rule | `community-weekly-match-generation-dev` |
| Schedule | `cron(0 3 ? * MON *)` - Every Monday 3 AM UTC |
| CloudWatch Logs | `/aws/lambda/community-match-generation-dev` |
| Supabase Secret | `community-app/supabase-dev` |

**Deployment checklist:**
- [x] Create Supabase secret in Secrets Manager ✅
- [x] Deploy `CommunityMatching-dev` stack ✅
- [x] Test Lambda with manual invocation ✅ (2 users, 1 match generated)
- [x] Verify EventBridge rule created ✅
- [x] Monitor CloudWatch logs ✅

**Test Results:**
```json
{
  "week": "2025-W49",
  "totalUsersProcessed": 2,
  "totalMatchesGenerated": 1,
  "successfulUsers": 2,
  "failedUsers": 0,
  "durationMs": 2865
}
```

#### 4.4: API Gateway for HTTP Endpoints (Optional - Future)
- [ ] Create REST API or HTTP API in API Gateway
- [ ] Set up routes for manual trigger
- [ ] Configure CORS

> **Note:** API Gateway is optional for Phase 4. The Lambda is primarily 
> triggered by EventBridge cron. The existing Next.js API routes continue 
> to work for manual triggers during development.

**Validation:**
- [x] Can trigger match generation manually via Lambda invoke ✅
- [x] Weekly cron configured (every Monday 3 AM UTC) ✅
- [x] Matches are created in Supabase ✅
- [x] Lambda logs appear in CloudWatch ✅
- [x] Secrets Manager integration working ✅

---

### Phase 5: Real-Time Messaging (Redis Pub/Sub + WebSockets) 💬
**Timeline:** Week 8-9  
**Risk:** Medium  
**Dependencies:** Phase 1, Phase 3  
**Note:** This is for Phase 6.3 of your workplan

#### 5.1: Architecture Decision

**Option A: ElastiCache Redis + WebSockets (Recommended for Learning)**
- Best learning experience - teaches Redis fundamentals
- Lower cost at scale (~$12/month vs $40+ for AppSync)
- More control over message flow
- Can reuse Redis for caching, rate limiting, sessions
- Industry-standard Pub/Sub pattern

**Option B: AWS AppSync (GraphQL)**
- Managed service, less code to write
- Built-in GraphQL subscriptions
- Higher cost, less control
- Less learning opportunity

**Option C: API Gateway WebSockets + Lambda (No Redis)**
- More complex, requires DynamoDB for connection state
- No Pub/Sub layer, harder to scale

**Recommended: Option A (Redis + WebSockets)** for best learning and cost

#### 5.2: Set Up ElastiCache Redis (Option A - Recommended)
- [ ] Create VPC if not already done (from Phase 1)
- [ ] Create ElastiCache subnet group
- [ ] Create security group for Redis (port 6379)
- [ ] Launch ElastiCache Redis cluster:
  - Instance: `cache.t4g.micro` (~$12/month)
  - Engine version: Redis 7.x
  - No replication (dev), enable for prod
- [ ] Test Redis connectivity from Lambda
- [ ] Create DynamoDB table for WebSocket connections:
  ```
  Table: websocket-connections
  PK: connectionId (String)
  GSI: userId-index (for quick lookups)
  TTL: expiresAt (automatic cleanup)
  ```

**CDK Stack:**
```typescript
// aws/cdk/lib/cache-stack.ts
const redis = new elasticache.CfnCacheCluster(this, 'RedisCluster', {
  cacheNodeType: 'cache.t4g.micro',
  engine: 'redis',
  numCacheNodes: 1,
});
```

#### 5.3: Set Up WebSocket API
- [ ] Create WebSocket API in API Gateway
- [ ] Create Lambda functions:
  - `connect.ts` - Store connection ID in DynamoDB
  - `disconnect.ts` - Remove connection ID
  - `message.ts` - Handle incoming messages
  - `redis-subscriber.ts` - Long-running subscriber (or ECS container)
- [ ] Configure WebSocket routes ($connect, $disconnect, $default)
- [ ] Grant Lambda permission to access Redis and DynamoDB
- [ ] Set up API Gateway WebSocket domain (optional)

#### 5.4: Implement Redis Pub/Sub Broadcasting
- [ ] Create message publisher in Next.js API route
  - Saves message to RDS
  - Publishes to Redis channel: `chat:{conversationId}`
- [ ] Create Redis subscriber (Lambda or ECS):
  - Subscribes to `chat:*` channels
  - Receives messages from Redis
  - Looks up active connections in DynamoDB
  - Sends to WebSocket connections via API Gateway
- [ ] Handle stale connections (410 errors)
- [ ] Implement reconnection logic

**Files to create:**
- `aws/cdk/lib/cache-stack.ts` - ElastiCache Redis
- `aws/cdk/lib/websocket-stack.ts` - WebSocket API + Lambdas
- `aws/lambdas/websocket/connect.ts`
- `aws/lambdas/websocket/disconnect.ts`
- `aws/lambdas/websocket/message.ts`
- `aws/lambdas/websocket/redis-subscriber.ts`
- `src/app/api/messages/route.ts` - Publishes to Redis
- `src/lib/aws/websocket.ts` - Frontend WebSocket client

#### 5.5: Frontend WebSocket Integration
- [ ] Install Redis client for API routes: `npm install ioredis`
- [ ] Create WebSocket client utility
- [ ] Create messaging components (from workplan Phase 6.3):
  - Conversation list
  - Message thread
  - Real-time message updates
- [ ] Implement connection management (reconnect on disconnect)
- [ ] Add typing indicators (optional, via Redis)
- [ ] Add online/offline status (via Redis)

**Files to create:**
- `src/lib/aws/websocket.ts` - WebSocket client
- `src/components/messaging/ChatList.tsx`
- `src/components/messaging/ChatThread.tsx`
- `src/components/messaging/MessageComposer.tsx`
- `src/hooks/useMessages.ts` - Real-time message hook

**Environment Variables:**
```bash
# Backend (Lambda)
REDIS_ENDPOINT=your-redis.cache.amazonaws.com:6379
WEBSOCKET_ENDPOINT=https://xxxxx.execute-api.us-east-1.amazonaws.com/prod

# Frontend
NEXT_PUBLIC_WEBSOCKET_URL=wss://xxxxx.execute-api.us-east-1.amazonaws.com/prod
```

**Validation:**
- [ ] Can send message between users
- [ ] Receive messages in real-time (<1s latency)
- [ ] Redis Pub/Sub working (verify with Redis CLI)
- [ ] WebSocket reconnection working
- [ ] Messages persist in RDS
- [ ] Stale connections cleaned up automatically
- [ ] Multiple users can join same conversation

---

### Phase 6: Deployment & Infrastructure as Code 🏗️
**Timeline:** Week 10  
**Risk:** Low  
**Dependencies:** All previous phases  

#### 6.1: Complete CDK Infrastructure
- [ ] Consolidate all stacks into main CDK app
- [ ] Create separate stacks:
  - `NetworkStack` - VPC, subnets, security groups
  - `DatabaseStack` - RDS, secrets
  - `StorageStack` - S3, CloudFront
  - `AuthStack` - Cognito
  - `ApiStack` - API Gateway, Lambda functions
  - `MessagingStack` - AppSync or WebSocket
  - `MonitoringStack` - CloudWatch alarms, dashboards
- [ ] Parameterize for multiple environments (dev, staging, prod)
- [ ] Set up CDK Pipelines for CI/CD

**Files to create:**
- `aws/cdk/bin/community-app.ts` - CDK app entry point
- `aws/cdk/lib/*-stack.ts` - Individual stack files
- `aws/cdk/cdk.json` - CDK configuration

#### 6.2: Environment Management
- [ ] Create `.env.development.local` (AWS)
- [ ] Create `.env.production.local` (AWS)
- [ ] Store secrets in AWS Secrets Manager
- [ ] Update Next.js config to read from Secrets Manager
- [ ] Remove all Supabase environment variables

#### 6.3: Migrate from Vercel to AWS
**Option A: Keep Vercel, use AWS for backend only**
- Simplest, Vercel handles frontend deployment
- API routes proxy to API Gateway

**Option B: Migrate to AWS Amplify Hosting**
- [ ] Create Amplify app
- [ ] Connect GitHub repository
- [ ] Configure build settings
- [ ] Set up custom domain
- [ ] Configure environment variables

**Option C: Use AWS with containers (ECS/Fargate)**
- [ ] Containerize Next.js app
- [ ] Push to ECR
- [ ] Deploy to ECS Fargate
- [ ] Set up ALB for load balancing

**Option D: Use AWS Lambda (Next.js serverless)**
- [ ] Use OpenNext to deploy Next.js to Lambda
- [ ] Deploy via CDK
- More complex setup

**Recommendation:** Start with Option A, move to Option B later

#### 6.4: CI/CD Pipeline
- [ ] Set up GitHub Actions or AWS CodePipeline
- [ ] Automated testing before deployment
- [ ] Deploy infrastructure via CDK
- [ ] Deploy Lambda functions
- [ ] Deploy Next.js app
- [ ] Run smoke tests

**Files to create:**
- `.github/workflows/deploy-aws.yml`
- `aws/scripts/deploy.sh`

**Validation:**
- [ ] Can deploy entire stack from CDK
- [ ] All resources created correctly
- [ ] Application accessible via domain
- [ ] All features working in production

---

### Phase 7: Monitoring, Logging & Optimization 📊
**Timeline:** Week 11  
**Risk:** Low  
**Dependencies:** Phase 6  

#### 7.1: CloudWatch Setup
- [ ] Create CloudWatch dashboard
- [ ] Set up metrics:
  - Lambda invocations, duration, errors
  - API Gateway requests, latency, errors
  - RDS connections, CPU, storage
  - AppSync operations
- [ ] Create CloudWatch alarms:
  - Lambda error rate > 5%
  - API Gateway 5xx errors
  - RDS CPU > 80%
  - RDS storage < 10%
- [ ] Set up SNS topic for alarm notifications

#### 7.2: Logging & Tracing
- [ ] Enable Lambda function logging (CloudWatch Logs)
- [ ] Enable API Gateway access logs
- [ ] Enable RDS query logging (for debugging)
- [ ] Set up AWS X-Ray for distributed tracing
  - Trace Lambda functions
  - Trace API Gateway requests
  - Trace RDS queries
- [ ] Create log insights queries for common issues

#### 7.3: Cost Optimization
- [ ] Review and right-size RDS instance
- [ ] Set up S3 lifecycle policies
- [ ] Configure Lambda reserved concurrency
- [ ] Use AWS Compute Optimizer recommendations
- [ ] Set up AWS Budgets with alerts
- [ ] Tag all resources for cost allocation

**CDK Stack:**
```typescript
// aws/cdk/lib/monitoring-stack.ts
const dashboard = new cloudwatch.Dashboard(this, 'AppDashboard', {
  dashboardName: 'CommunityApp-Metrics'
});

const errorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
  metric: matchLambda.metricErrors(),
  threshold: 5,
  evaluationPeriods: 1,
});

errorAlarm.addAlarmAction(new cw_actions.SnsAction(alarmTopic));
```

**Validation:**
- [ ] Dashboard shows all key metrics
- [ ] Alarms trigger correctly
- [ ] Logs searchable in CloudWatch
- [ ] X-Ray traces show request flow
- [ ] Cost tracking accurate

---

### Phase 8: Replace RLS with Application-Level Security 🔒
**Timeline:** Week 12  
**Risk:** Medium  
**Dependencies:** Phase 3, Phase 4  

#### 8.1: Understanding the Gap
Supabase RLS automatically enforces row-level permissions in the database. AWS RDS doesn't have this feature, so you must implement security in your application layer.

#### 8.2: API Authorization
- [ ] Create middleware for Lambda functions
- [ ] Extract user ID from Cognito JWT
- [ ] Enforce authorization rules:
  - Users can only read/write their own profile
  - Users can only see matches assigned to them
  - Users can only send messages to matched users
- [ ] Create authorization utility functions

**Files to create:**
- `aws/lambdas/shared/authorization.ts`
- Example:
  ```typescript
  export function authorizeProfileAccess(tokenUserId: string, profileUserId: string) {
    if (tokenUserId !== profileUserId) {
      throw new UnauthorizedError('Cannot access another user\'s profile');
    }
  }
  
  export async function authorizeMessageAccess(
    tokenUserId: string, 
    conversationId: string,
    db: DatabaseClient
  ) {
    const conversation = await db.getConversation(conversationId);
    if (!conversation.participants.includes(tokenUserId)) {
      throw new UnauthorizedError('Cannot access this conversation');
    }
  }
  ```

#### 8.3: Database Query Filtering
- [ ] Update all database queries to include user ID filters
- [ ] Add user ID checks before any write operation
- [ ] Review all SQL queries for security issues
- [ ] Implement prepared statements (prevent SQL injection)

**Example:**
```typescript
// Bad (Supabase RLS handles this)
const { data } = await supabase.from('profiles').select('*');

// Good (AWS - explicit filtering)
const profiles = await db.query(
  'SELECT * FROM profiles WHERE user_id = $1',
  [tokenUserId]
);
```

#### 8.4: Security Testing
- [ ] Write tests for authorization logic
- [ ] Test unauthorized access attempts
- [ ] Penetration testing (or use AWS Inspector)
- [ ] Review IAM permissions (principle of least privilege)

**Validation:**
- [ ] Cannot access another user's profile
- [ ] Cannot read messages from other conversations
- [ ] Cannot generate matches for other users
- [ ] All API calls require valid JWT
- [ ] Expired tokens rejected

---

### Phase 9: Data Migration & Cutover 🔄
**Timeline:** Week 13  
**Risk:** HIGH ⚠️  
**Dependencies:** All previous phases  

#### 9.1: Pre-Cutover Validation
- [ ] All features working in AWS
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Backup procedures tested
- [ ] Rollback plan documented
- [ ] User communication prepared

#### 9.2: Final Data Sync
- [ ] Stop writes to Supabase (maintenance mode)
- [ ] Export final data snapshot
- [ ] Import to AWS RDS
- [ ] Verify data integrity
- [ ] Test with production data

#### 9.3: DNS & Traffic Cutover
- [ ] Update environment variables in production
- [ ] Deploy new version with AWS endpoints
- [ ] Monitor error rates
- [ ] Test critical user flows
- [ ] Monitor CloudWatch dashboards

#### 9.4: Post-Cutover
- [ ] Keep Supabase active for 7 days (safety net)
- [ ] Monitor for issues
- [ ] Address any migration bugs
- [ ] Collect user feedback
- [ ] Document any issues

#### 9.5: Decommission Supabase
- [ ] Final data backup from Supabase
- [ ] Download all logs
- [ ] Cancel Supabase subscription
- [ ] Remove Supabase dependencies from code:
  - [ ] Uninstall `@supabase/supabase-js`
  - [ ] Delete `src/lib/supabase/`
  - [ ] Remove Supabase env vars
  - [ ] Delete `supabase/` directory
  - [ ] Update documentation

**Validation:**
- [ ] All users migrated successfully
- [ ] Zero data loss
- [ ] Application fully functional
- [ ] Performance metrics acceptable
- [ ] No Supabase code remaining

---

## 📦 Code Changes Summary

### Files Created ✅
```
aws/
├── cdk/
│   ├── bin/community-app.ts          ✅ Created (updated for Phase 4)
│   ├── lib/
│   │   ├── network-stack.ts          ✅ Created
│   │   ├── storage-stack.ts          ✅ Created
│   │   ├── matching-stack.ts         ✅ Created (Phase 4 - Lambda + EventBridge)
│   │   ├── database-stack.ts         (skipped - using Supabase)
│   │   ├── auth-stack.ts             (skipped - using Supabase Auth)
│   │   ├── api-stack.ts              (Future - optional API Gateway)
│   │   ├── messaging-stack.ts        (Phase 5)
│   │   └── monitoring-stack.ts       (Phase 7)
│   ├── cdk.json                      ✅ Created
│   └── package.json                  ✅ Created
├── lambdas/
│   ├── shared/
│   │   ├── supabase-client.ts        ✅ Created (Phase 4 - Secrets Manager integration)
│   │   ├── package.json              ✅ Created (Phase 4)
│   │   ├── tsconfig.json             ✅ Created (Phase 4)
│   │   └── authorization.ts          (Phase 8)
│   ├── matching/
│   │   ├── generate-matches.ts       ✅ Created (Phase 4 - complete matching logic)
│   │   ├── package.json              ✅ Created (Phase 4)
│   │   └── tsconfig.json             ✅ Created (Phase 4)
│   ├── auth/                         (skipped - using Supabase Auth)
│   ├── websocket/                    (Phase 5)
│   └── image-processor/              (optional enhancement)
└── docs/
    └── database-schema-snapshot.md   ✅ Created

src/lib/aws/
├── storage.ts                        ✅ Created - Server-side S3 utilities
├── storage-client.ts                 ✅ Created - Client-side upload utilities
├── auth.ts                           (skipped - using Supabase Auth)
├── database.ts                       (skipped - using Supabase)
└── websocket.ts                      (Phase 5)

src/app/api/photos/
├── presigned-url/route.ts            ✅ Created - Presigned URL generation
└── delete/route.ts                   ✅ Created - S3 delete endpoint

src/components/messaging/             (Phase 5 - future)
├── ChatList.tsx
├── ChatThread.tsx
└── MessageComposer.tsx
```

### Files Modified ✅
```
src/components/profile/ProfileEdit.tsx ✅ Updated - S3 upload/delete with fallback
package.json                           ✅ Updated - Added @aws-sdk packages
env.aws.template                       ✅ Updated - Documented S3 env vars
```

### Files to Modify (Future Phases)
```
src/hooks/useAuthSession.tsx           → (skipped - using Supabase Auth)
src/components/auth/EmailAuthForm.tsx  → (skipped - using Supabase Auth)
src/lib/matching/database.ts           → Phase 4: Lambda connection to Supabase
src/app/api/matches/generate/route.ts  → Phase 4: Migrate to Lambda
.env.local                             → Add AWS env vars for each phase
next.config.ts                         → AWS-specific config if needed
```

### Files to Delete (After Migration)
```
src/lib/supabase/client.ts
src/lib/supabase/types.ts
supabase/migrations/*
.env (Supabase vars)
```

---

## 🎓 Learning Outcomes

By completing this migration, you'll gain hands-on experience with:

### Infrastructure & DevOps
- ✅ VPC networking and security groups
- ✅ RDS database management and backups
- ✅ S3 storage and CloudFront CDN
- ✅ Infrastructure as Code (AWS CDK)
- ✅ CI/CD pipelines

### Serverless Architecture  
- ✅ Lambda function development and optimization
- ✅ API Gateway configuration
- ✅ EventBridge for scheduling
- ✅ DynamoDB for NoSQL data (connections table)

### Security & Identity
- ✅ Cognito user management
- ✅ IAM roles and policies
- ✅ JWT authentication flows
- ✅ Application-level authorization
- ✅ Secrets management

### Real-Time Systems
- ✅ Redis Pub/Sub messaging patterns
- ✅ WebSocket connection management
- ✅ ElastiCache deployment and configuration
- ✅ Message broadcasting at scale
- ✅ Connection state management with DynamoDB

### Observability
- ✅ CloudWatch metrics and alarms
- ✅ Distributed tracing with X-Ray
- ✅ Log aggregation and analysis

### Database Management
- ✅ PostgreSQL administration
- ✅ PostGIS geographic queries
- ✅ Connection pooling
- ✅ Query optimization

---

## 💰 Cost Estimation

### Development Environment (Free Tier)
- RDS db.t4g.micro: **FREE** (750 hours/month)
- Lambda: **FREE** (1M requests/month)
- API Gateway: **FREE** (1M requests/month)
- S3: **FREE** (5GB storage, 20K GET, 2K PUT)
- CloudFront: **FREE** (50GB/month)
- Cognito: **FREE** (50K MAU)
- **Total: ~$0-5/month**

### Production (After Free Tier)
- RDS db.t4g.small: **~$25/month**
- Lambda: **~$5/month** (assuming 5M requests)
- API Gateway (REST + WebSocket): **~$5/month**
- S3 + CloudFront: **~$10/month** (100GB storage, 1TB transfer)
- Cognito: **~$25/month** (10K active users)
- ElastiCache Redis (t4g.micro): **~$12/month**
- **Total: ~$82/month** for 10K users

Compare to:
- Supabase Pro: **$25/month** (but limited to 500 concurrent connections)
- AWS with AppSync: **~$100/month** (more expensive, less learning)

---

## ⚠️ Risk Mitigation

### High-Risk Areas
1. **Authentication migration** - Users can't login
   - Mitigation: Dual-auth period, user migration script
2. **Data migration** - Data loss or corruption
   - Mitigation: Multiple backups, validation scripts, dry runs
3. **Real-time messaging** - Connection issues
   - Mitigation: Thorough testing, gradual rollout

### Rollback Strategy
- Keep Supabase active during migration
- Feature flags for AWS vs Supabase code paths
- Ability to switch back via environment variables
- Maintain dual-write for critical data during transition

---

## 📚 Recommended Resources

### AWS Documentation
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [AWS CDK Developer Guide](https://docs.aws.amazon.com/cdk/)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)

### Courses
- AWS Certified Solutions Architect - Associate (SAA-C03)
- AWS Serverless Learning Plan
- "AWS for React Developers" (freeCodeCamp)

### Community
- AWS Subreddit: r/aws
- AWS Community Builders
- Local AWS User Groups

---

## 🚀 Quick Start - Current State

### ✅ Already Completed

```bash
# AWS Account & CLI configured ✅
aws sts get-caller-identity --profile community-app

# CDK bootstrapped ✅
# Git branch created ✅
git branch --show-current  # feature/aws-migration

# Infrastructure deployed ✅
aws cloudformation list-stacks --query "Stacks[?contains(StackName,'Community')]"

# AWS SDK installed ✅
npm list @aws-sdk/client-s3  # Check installation
```

### 📦 Deployed Resources

| Resource | ID/URL |
|----------|--------|
| VPC | `vpc-0c45aa7745bbe6095` |
| S3 Bucket | `community-app-photos-dev-879381267216` |
| CloudFront | `https://d2rld0uk0j0fpj.cloudfront.net` |
| Lambda Function | `community-match-generation-dev` |
| EventBridge Rule | `community-weekly-match-generation-dev` |
| Supabase Secret | `community-app/supabase-dev` |

### 🧪 S3 Storage Configuration

Add these environment variables to your `.env.local`:

```bash
AWS_S3_PHOTOS_BUCKET=community-app-photos-dev-879381267216
AWS_CLOUDFRONT_DOMAIN=d2rld0uk0j0fpj.cloudfront.net
AWS_REGION=us-east-1
AWS_PROFILE=community-app
```

**S3 storage is now the default for all photo uploads.**

### 🎯 Phase 4 Complete - Useful Commands

**Invoke Lambda Manually:**
```bash
aws lambda invoke \
  --function-name community-match-generation-dev \
  --profile community-app \
  output.json && cat output.json
```

**View Lambda Logs:**
```bash
aws logs tail /aws/lambda/community-match-generation-dev \
  --profile community-app --follow
```

**Check EventBridge Schedule:**
```bash
aws events describe-rule \
  --name community-weekly-match-generation-dev \
  --profile community-app
```

**Update Supabase Secret (if needed):**
```bash
aws secretsmanager update-secret \
  --secret-id community-app/supabase-dev \
  --secret-string '{"SUPABASE_URL":"new-url","SUPABASE_SERVICE_ROLE_KEY":"new-key"}' \
  --profile community-app
```

### 🔜 Next Phase Options

1. **Phase 5: Real-Time Messaging** - ElastiCache Redis + WebSockets (~$12/month)
2. **Phase 7: Monitoring** - CloudWatch dashboards and alarms ($0 free tier)
3. Continue with **Phase 6.2 of workplan** - Match Display UI

### Hybrid Architecture (Current)

```
┌─────────────────────────────────────────────────────────────┐
│                    Community Friends App                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐         ┌─────────────────────────────┐   │
│  │   Vercel    │         │        AWS ($0/month)       │   │
│  │  (Next.js)  │         │                             │   │
│  │             │────────▶│  S3 + CloudFront (photos) ✅│   │
│  │  API Routes │         │                             │   │
│  │  • /api/photos/presigned-url                        │   │
│  │  • /api/photos/delete │  Lambda + EventBridge      │   │
│  │  • /api/matches/*     │  (weekly cron) [READY]  ✅ │   │
│  └─────────────┘         └─────────────────────────────┘   │
│         │                         │         │               │
│         │                         │ photos  │ matches       │
│         ▼                         ▼         ▼               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Supabase (Free Tier)                   │   │
│  │                                                     │   │
│  │  • PostgreSQL + PostGIS (database)                  │   │
│  │  • Auth with Magic Links                            │   │
│  │  • Row Level Security                               │   │
│  │  • user_photos table (stores S3 keys + URLs)        │   │
│  │  • matches table (Lambda writes here weekly)        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Architecture Decisions

1. **Database:** Supabase PostgreSQL (keeping for now, $0)
2. **Auth:** Supabase Auth with magic links (keeping, $0)
3. **Photo Storage:** AWS S3 + CloudFront (deployed, $0)
4. **Cron Jobs:** AWS Lambda + EventBridge (next up, $0)
5. **Deployment:** Vercel for Next.js (keeping)
6. **Full AWS Migration:** Future phase when ready

---

