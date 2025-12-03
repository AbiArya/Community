import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import * as path from 'path';

interface MatchingStackProps extends cdk.StackProps {
  environment: string;
}

/**
 * Matching Stack
 * 
 * Creates Lambda function for match generation and EventBridge rule
 * for weekly scheduled execution (every Monday at 3 AM UTC).
 * 
 * The Lambda connects to Supabase (not RDS) for the hybrid approach.
 * 
 * Free Tier:
 * - Lambda: 1M requests/month FREE
 * - EventBridge: 14M invocations/month FREE
 * - CloudWatch Logs: 5GB/month FREE
 */
export class MatchingStack extends cdk.Stack {
  public readonly matchGenerationLambda: lambdaNodejs.NodejsFunction;
  public readonly weeklyScheduleRule: events.Rule;

  constructor(scope: Construct, id: string, props: MatchingStackProps) {
    super(scope, id, props);

    const { environment } = props;

    // ============================================================
    // Secrets Manager for Supabase credentials
    // ============================================================
    // NOTE: You need to create this secret manually or via CLI:
    // aws secretsmanager create-secret --name community-app/supabase-${environment} \
    //   --secret-string '{"SUPABASE_URL":"your-url","SUPABASE_SERVICE_ROLE_KEY":"your-key"}'
    const supabaseSecretArn = `arn:aws:secretsmanager:${this.region}:${this.account}:secret:community-app/supabase-${environment}`;

    // Import the secret reference (the actual secret must exist)
    const supabaseSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      'SupabaseSecret',
      `community-app/supabase-${environment}`
    );

    // ============================================================
    // Lambda Function using NodejsFunction for automatic bundling
    // ============================================================
    this.matchGenerationLambda = new lambdaNodejs.NodejsFunction(this, 'MatchGenerationLambda', {
      functionName: `community-match-generation-${environment}`,
      description: 'Generates weekly matches for all eligible users',
      
      // Entry point - NodejsFunction will compile and bundle automatically
      entry: path.join(__dirname, '../../lambdas/matching/generate-matches.ts'),
      handler: 'handler',
      
      // Use Node.js 20.x for best Lambda performance
      runtime: lambda.Runtime.NODEJS_20_X,

      // Bundling options using esbuild
      bundling: {
        minify: environment === 'prod',
        sourceMap: environment !== 'prod',
        // External modules that Lambda runtime provides (AWS SDK v3 is included)
        externalModules: ['@aws-sdk/*'],
        // Bundle everything else (including Supabase) into the output
        // This avoids npm install issues during bundling
      },

      // Lambda configuration
      memorySize: 512, // MB - increase if needed for more users
      timeout: cdk.Duration.minutes(5), // 5 min timeout for batch processing
      
      // Environment variables
      environment: {
        NODE_ENV: environment === 'prod' ? 'production' : 'development',
        SUPABASE_SECRET_NAME: `community-app/supabase-${environment}`,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1', // Reuse HTTP connections
      },
      
      // CloudWatch Logs configuration
      logRetention: environment === 'prod' 
        ? logs.RetentionDays.ONE_MONTH 
        : logs.RetentionDays.ONE_WEEK,
      
      // Retry configuration for async invocations
      retryAttempts: 2,
      
      // Reserved concurrency to prevent runaway costs
      // Only set for production - dev accounts may have limited quota
      ...(environment === 'prod' && { reservedConcurrentExecutions: 5 }),
    });

    // Grant Lambda permission to read secrets
    supabaseSecret.grantRead(this.matchGenerationLambda);

    // Add inline policy to fetch secrets at runtime
    this.matchGenerationLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: [supabaseSecretArn + '*'], // Wildcard for secret version
      })
    );

    // ============================================================
    // EventBridge Schedule Rule (Cron)
    // ============================================================
    this.weeklyScheduleRule = new events.Rule(this, 'WeeklyMatchGenerationRule', {
      ruleName: `community-weekly-match-generation-${environment}`,
      description: 'Triggers match generation every Monday at 3 AM UTC',
      
      // Cron expression: 3 AM UTC every Monday
      // Format: minute hour day-of-month month day-of-week year
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '3',
        weekDay: 'MON',
      }),
      
      // Enable the rule (set to false to pause scheduling)
      enabled: true,
    });

    // Add Lambda as target for the EventBridge rule
    this.weeklyScheduleRule.addTarget(
      new targets.LambdaFunction(this.matchGenerationLambda, {
        retryAttempts: 2,
        maxEventAge: cdk.Duration.hours(1),
      })
    );

    // ============================================================
    // CloudWatch Alarm (optional but recommended)
    // ============================================================
    const errorAlarm = this.matchGenerationLambda.metricErrors({
      period: cdk.Duration.minutes(5),
    }).createAlarm(this, 'MatchGenerationErrorAlarm', {
      alarmName: `community-match-generation-errors-${environment}`,
      alarmDescription: 'Triggered when match generation Lambda has errors',
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // ============================================================
    // Outputs
    // ============================================================
    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: this.matchGenerationLambda.functionName,
      description: 'Name of the match generation Lambda function',
      exportName: `CommunityMatchLambda-${environment}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: this.matchGenerationLambda.functionArn,
      description: 'ARN of the match generation Lambda function',
    });

    new cdk.CfnOutput(this, 'EventBridgeRuleName', {
      value: this.weeklyScheduleRule.ruleName,
      description: 'Name of the weekly schedule EventBridge rule',
    });

    new cdk.CfnOutput(this, 'EventBridgeRuleArn', {
      value: this.weeklyScheduleRule.ruleArn,
      description: 'ARN of the weekly schedule EventBridge rule',
    });

    new cdk.CfnOutput(this, 'LogGroupName', {
      value: `/aws/lambda/${this.matchGenerationLambda.functionName}`,
      description: 'CloudWatch Log Group for Lambda function',
    });

    new cdk.CfnOutput(this, 'ManualInvokeCommand', {
      value: `aws lambda invoke --function-name ${this.matchGenerationLambda.functionName} --profile community-app output.json && cat output.json`,
      description: 'AWS CLI command to manually invoke the Lambda',
    });

    new cdk.CfnOutput(this, 'SecretSetupCommand', {
      value: `aws secretsmanager create-secret --name community-app/supabase-${environment} --secret-string '{"SUPABASE_URL":"your-url","SUPABASE_SERVICE_ROLE_KEY":"your-key"}' --profile community-app`,
      description: 'AWS CLI command to create Supabase secrets (run this first!)',
    });
  }
}

