#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { DatabaseStack } from '../lib/database-stack';
import { StorageStack } from '../lib/storage-stack';

const app = new cdk.App();

// Get environment from context (default to 'dev')
const environment = app.node.tryGetContext('environment') || 'dev';
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION || 'us-east-1';

const env = { account, region };

// Tags for all resources
const tags = {
  Project: 'CommunityFriendsApp',
  Environment: environment,
  ManagedBy: 'CDK',
};

// ============================================================
// COST-FREE LEARNING SETUP
// ============================================================
// For learning: Deploy Network + Storage only ($0/month)
// Skip: Database (use Supabase instead)
//
// Deploy order:
//   1. cdk deploy CommunityNetwork-dev   (~2 min, $0)
//   2. cdk deploy CommunityStorage-dev   (~5 min, $0)
//
// Skip for now:
//   - CommunityDatabase-dev  (~$15/month after free tier)
// ============================================================

// Network Stack (VPC, Subnets, Security Groups)
// Cost: $0 in zeroCostMode (default for dev)
const networkStack = new NetworkStack(app, `CommunityNetwork-${environment}`, {
  env,
  description: 'Network infrastructure for Community Friends App',
  environment,
  zeroCostMode: environment !== 'prod', // Free for dev/staging!
});

// Database Stack (RDS PostgreSQL with PostGIS)
// OPTIONAL: Skip this for learning - use Supabase instead!
// Cost: ~$15/month after free tier expires
const databaseStack = new DatabaseStack(app, `CommunityDatabase-${environment}`, {
  env,
  description: 'RDS PostgreSQL database with PostGIS (OPTIONAL - use Supabase instead)',
  vpc: networkStack.vpc,
  environment,
});

// Storage Stack (S3 + CloudFront)
// Cost: $0 (free tier: 5GB storage, 50GB transfer)
const storageStack = new StorageStack(app, `CommunityStorage-${environment}`, {
  env,
  description: 'S3 storage and CloudFront CDN for photos',
  environment,
});

// Apply tags to all stacks
Object.entries(tags).forEach(([key, value]) => {
  cdk.Tags.of(networkStack).add(key, value);
  cdk.Tags.of(databaseStack).add(key, value);
  cdk.Tags.of(storageStack).add(key, value);
});

app.synth();

