import * as cdk from "aws-cdk-lib/core";
import {
  aws_s3 as s3,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as cloudfront_origins,
  aws_ssm as ssm,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { PARAMETER_BASE_PATH } from "../constants";

export class WebStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.bucket = new s3.Bucket(this, "Bucket", {
      bucketName: `itala-${this.account}-web`,
      bucketNamespace: s3.BucketNamespace.GLOBAL,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: false,
      enforceSSL: true,
      bucketKeyEnabled: true,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new ssm.StringParameter(this, "BucketNameParameter", {
      parameterName: `/${PARAMETER_BASE_PATH}/client-artifact-bucket-name`,
      stringValue: this.bucket.bucketName,
    });

    this.distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: cloudfront_origins.S3BucketOrigin.withOriginAccessControl(
          this.bucket,
        ),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
    });
    cdk.Tags.of(this.distribution).add("Name", "Itala");

    new ssm.StringParameter(this, "DistributionIdParameter", {
      parameterName: `/${PARAMETER_BASE_PATH}/client-distribution-id`,
      stringValue: this.distribution.distributionId,
    });
  }
}
