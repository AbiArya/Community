import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface NetworkStackProps extends cdk.StackProps {
  /**
   * Environment name (dev, staging, prod)
   */
  environment: string;
  /**
   * Set to true for zero-cost development (no NAT gateway)
   * NAT Gateway costs ~$32/month!
   * Default: true for dev, false for prod
   */
  zeroCostMode?: boolean;
}

/**
 * Network Stack
 * Creates VPC, subnets, and security groups
 * 
 * COST WARNING:
 * - Zero cost mode (dev): $0/month - uses public subnets only
 * - Full mode (prod): ~$32/month - includes NAT gateway
 */
export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly dbSecurityGroup: ec2.SecurityGroup;
  public readonly lambdaSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    const { environment } = props;
    // Default to zero cost mode for non-prod environments
    const zeroCostMode = props.zeroCostMode ?? (environment !== 'prod');

    // Create VPC - configuration depends on cost mode
    if (zeroCostMode) {
      // ZERO COST MODE: Public subnets only, no NAT gateway
      // Perfect for learning - Lambda uses public subnets
      // Cost: $0/month
      this.vpc = new ec2.Vpc(this, 'CommunityVpc', {
        ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
        maxAzs: 2,
        natGateways: 0, // NO NAT GATEWAY = $0
        subnetConfiguration: [
          {
            name: 'Public',
            subnetType: ec2.SubnetType.PUBLIC,
            cidrMask: 24,
          },
          {
            // Isolated subnets for databases (if you deploy RDS later)
            name: 'Database',
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            cidrMask: 24,
          },
        ],
      });
    } else {
      // PRODUCTION MODE: Full VPC with NAT gateway
      // Cost: ~$32/month for NAT gateway
      this.vpc = new ec2.Vpc(this, 'CommunityVpc', {
        ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
        maxAzs: 2,
        natGateways: 1, // NAT gateway for private subnet egress
        subnetConfiguration: [
          {
            name: 'Public',
            subnetType: ec2.SubnetType.PUBLIC,
            cidrMask: 24,
          },
          {
            name: 'Private',
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            cidrMask: 24,
          },
          {
            name: 'Database',
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            cidrMask: 24,
          },
        ],
      });
    }

    // Security group for RDS database
    this.dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSG', {
      vpc: this.vpc,
      description: 'Security group for RDS PostgreSQL database',
      allowAllOutbound: false, // Explicit outbound rules
    });

    // Security group for Lambda functions
    this.lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSG', {
      vpc: this.vpc,
      description: 'Security group for Lambda functions',
      allowAllOutbound: true, // Lambda needs internet access
    });

    // Allow Lambda to connect to RDS on port 5432
    this.dbSecurityGroup.addIngressRule(
      this.lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda to access RDS'
    );

    // Allow local development access (remove in production!)
    // Replace with your IP address or bastion host
    this.dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('0.0.0.0/0'), // WARNING: Open to world - replace with your IP
      ec2.Port.tcp(5432),
      'Allow development access (REMOVE IN PRODUCTION!)'
    );

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: 'CommunityVpcId',
    });

    new cdk.CfnOutput(this, 'DatabaseSecurityGroupId', {
      value: this.dbSecurityGroup.securityGroupId,
      description: 'Database Security Group ID',
    });

    new cdk.CfnOutput(this, 'CostMode', {
      value: zeroCostMode ? 'ZERO COST ($0/month)' : 'PRODUCTION (~$32/month for NAT)',
      description: 'Network stack cost mode',
    });

    new cdk.CfnOutput(this, 'CostWarning', {
      value: zeroCostMode 
        ? '✅ Free tier - no NAT gateway' 
        : '⚠️ NAT Gateway costs ~$32/month',
      description: 'Cost information',
    });
  }
}

