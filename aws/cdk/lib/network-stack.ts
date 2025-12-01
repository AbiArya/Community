import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

/**
 * Network Stack
 * Creates VPC, subnets, security groups, and NAT gateways
 */
export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly dbSecurityGroup: ec2.SecurityGroup;
  public readonly lambdaSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC with public and private subnets
    // For learning: Set natGateways to 0 to avoid $32/month cost
    // For production: Set to 1 or 2 for private subnet internet access
    this.vpc = new ec2.Vpc(this, 'CommunityVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2, // Use 2 availability zones for high availability
      natGateways: 0, // 0 = $0/month (learning), 1 = $32/month (prod)
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        // Private subnets commented out for cost savings (no NAT = no internet for private subnets)
        // Uncomment when you need RDS or private resources
        // {
        //   name: 'Private',
        //   subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        //   cidrMask: 24,
        // },
        // {
        //   name: 'Database',
        //   subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        //   cidrMask: 24,
        // },
      ],
    });

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
  }
}

