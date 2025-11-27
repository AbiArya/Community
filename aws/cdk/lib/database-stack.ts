import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  environment: string;
}

/**
 * Database Stack
 * Creates RDS PostgreSQL instance with PostGIS extension
 */
export class DatabaseStack extends cdk.Stack {
  public readonly dbInstance: rds.DatabaseInstance;
  public readonly dbSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { vpc, environment } = props;

    // Create database credentials secret
    this.dbSecret = new secretsmanager.Secret(this, 'DbCredentials', {
      secretName: `community-db-credentials-${environment}`,
      description: 'Database credentials for Community Friends App',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'postgres' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 32,
      },
    });

    // Get security group from network stack
    const dbSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      'ImportedDbSG',
      cdk.Fn.importValue('CommunityVpcId'), // You'll need to adjust this
      { mutableSecurityRules: false }
    );

    // Create RDS PostgreSQL instance
    this.dbInstance = new rds.DatabaseInstance(this, 'CommunityDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_3,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        environment === 'prod' ? ec2.InstanceSize.SMALL : ec2.InstanceSize.MICRO
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      credentials: rds.Credentials.fromSecret(this.dbSecret),
      databaseName: 'community',
      allocatedStorage: 20,
      storageType: rds.StorageType.GP3,
      maxAllocatedStorage: 100, // Auto-scaling up to 100GB
      multiAz: environment === 'prod', // High availability in production
      publiclyAccessible: false,
      deletionProtection: environment === 'prod',
      removalPolicy: environment === 'prod' 
        ? cdk.RemovalPolicy.SNAPSHOT 
        : cdk.RemovalPolicy.DESTROY,
      backupRetention: cdk.Duration.days(environment === 'prod' ? 7 : 1),
      preferredBackupWindow: '03:00-04:00', // 3-4 AM UTC
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      enablePerformanceInsights: environment === 'prod',
      cloudwatchLogsExports: ['postgresql'], // Export logs to CloudWatch
    });

    // CloudFormation custom resource to install PostGIS extension
    // Note: You'll need to create a Lambda function to run SQL
    // For now, you'll install PostGIS manually after deployment:
    // psql -h <endpoint> -U postgres -d community -c "CREATE EXTENSION IF NOT EXISTS postgis;"

    // Outputs
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.dbInstance.dbInstanceEndpointAddress,
      description: 'RDS database endpoint',
      exportName: `CommunityDbEndpoint-${environment}`,
    });

    new cdk.CfnOutput(this, 'DatabasePort', {
      value: this.dbInstance.dbInstanceEndpointPort,
      description: 'RDS database port',
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: this.dbSecret.secretArn,
      description: 'ARN of the database credentials secret',
      exportName: `CommunityDbSecretArn-${environment}`,
    });

    new cdk.CfnOutput(this, 'DatabaseName', {
      value: 'community',
      description: 'Database name',
    });

    new cdk.CfnOutput(this, 'PostGISInstallCommand', {
      value: `psql -h ${this.dbInstance.dbInstanceEndpointAddress} -U postgres -d community -c "CREATE EXTENSION IF NOT EXISTS postgis;"`,
      description: 'Run this command to install PostGIS extension',
    });
  }
}

