import { aws_s3 as s3 } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";

export class BootstrapStack extends cdk.Stack {
  public readonly projectBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.projectBucket = new s3.Bucket(this, "ProjectBucket", {
      bucketName: `itala-${this.account}`,
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
  }
}
