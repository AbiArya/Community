import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface StorageStackProps extends cdk.StackProps {
  environment: string;
}

/**
 * Storage Stack
 * Creates S3 bucket for photo storage and CloudFront distribution for CDN
 */
export class StorageStack extends cdk.Stack {
  public readonly photoBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const { environment } = props;

    // Create S3 bucket for photos
    this.photoBucket = new s3.Bucket(this, 'PhotoBucket', {
      bucketName: `community-app-photos-${environment}-${this.account}`,
      versioned: environment === 'prod',
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // Private by default
      removalPolicy: environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: environment !== 'prod',
      lifecycleRules: [
        {
          id: 'TransitionToIA',
          enabled: environment === 'prod',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
        {
          id: 'DeleteIncompleteUploads',
          enabled: true,
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      cors: [
        {
          allowedOrigins: environment === 'prod' 
            ? ['https://yourdomain.com'] // Replace with your domain
            : ['http://localhost:3000', 'https://localhost:3000'],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
          ],
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
    });

    // Create CloudFront Origin Access Identity
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'PhotoBucketOAI',
      {
        comment: 'Access identity for Community Photos bucket',
      }
    );

    // Grant CloudFront read access to S3 bucket
    this.photoBucket.grantRead(originAccessIdentity);

    // Create CloudFront distribution
    this.distribution = new cloudfront.Distribution(this, 'PhotoCDN', {
      comment: 'CDN for Community app photos',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessIdentity(this.photoBucket, {
          originAccessIdentity,
        }),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Use only NA & Europe edge locations
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      enableIpv6: true,
    });

    // Grant Lambda/API access to upload photos (you'll use this in API stack)
    const uploadPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:PutObject',
        's3:PutObjectAcl',
        's3:DeleteObject',
        's3:GetObject',
      ],
      resources: [`${this.photoBucket.bucketArn}/*`],
    });

    // Outputs
    new cdk.CfnOutput(this, 'PhotoBucketName', {
      value: this.photoBucket.bucketName,
      description: 'S3 bucket for user photos',
      exportName: `CommunityPhotoBucket-${environment}`,
    });

    new cdk.CfnOutput(this, 'PhotoBucketArn', {
      value: this.photoBucket.bucketArn,
      description: 'ARN of photo bucket',
    });

    new cdk.CfnOutput(this, 'CloudFrontDomain', {
      value: this.distribution.distributionDomainName,
      description: 'CloudFront distribution domain',
      exportName: `CommunityCDNDomain-${environment}`,
    });

    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${this.distribution.distributionDomainName}`,
      description: 'CloudFront distribution URL',
    });

    new cdk.CfnOutput(this, 'UploadPolicyStatement', {
      value: JSON.stringify(uploadPolicy.toJSON()),
      description: 'IAM policy statement for photo uploads (use in Lambda roles)',
    });
  }
}

