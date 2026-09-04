import {
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as cloudfrontOrigins,
  aws_iam as iam,
  aws_s3 as s3,
  aws_ssm as ssm,
} from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import { PARAMETER_BASE_PATH } from "../constants";

interface WebStackProps extends cdk.StackProps {
  projectBucket: s3.Bucket;
}

export class WebStack extends cdk.Stack {
  public readonly cloudfrontDistribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: WebStackProps) {
    super(scope, id, props);

    const projectBucket = s3.Bucket.fromBucketAttributes(
      this,
      "ProjectBucket",
      {
        bucketName: props.projectBucket.bucketName,
        bucketArn: props.projectBucket.bucketArn,
      },
    );

    new ssm.StringParameter(this, "ClientArtifactS3UriParameter", {
      parameterName: `/${PARAMETER_BASE_PATH}/client-artifact-s3-uri`,
      stringValue: `s3://${props.projectBucket.bucketName}/client/latest`,
    });

    new ssm.StringParameter(this, "ClientArtifactS3UriBaseParameter", {
      parameterName: `/${PARAMETER_BASE_PATH}/client-artifact-s3-uri-base`,
      stringValue: `s3://${props.projectBucket.bucketName}/client`,
    });

    this.cloudfrontDistribution = new cloudfront.Distribution(
      this,
      "CloudfrontDistribution",
      {
        defaultRootObject: "index.html",
        defaultBehavior: {
          origin: cloudfrontOrigins.S3BucketOrigin.withOriginAccessControl(
            projectBucket,
            {
              originPath: "/client/latest",
            },
          ),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        errorResponses: [
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
            ttl: cdk.Duration.minutes(0),
          },
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
            ttl: cdk.Duration.minutes(0),
          },
        ],
      },
    );
    cdk.Tags.of(this.cloudfrontDistribution).add("Name", "Itala");

    new ssm.StringParameter(this, "CloudfrontDistributionIdParameter", {
      parameterName: `/${PARAMETER_BASE_PATH}/cloudfront-distribution-id`,
      stringValue: this.cloudfrontDistribution.distributionId,
    });

    new s3.CfnBucketPolicy(this, "WebProjectBucketPolicy", {
      bucket: props.projectBucket.bucketName,
      policyDocument: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            actions: ["s3:GetObject"],
            resources: [`${props.projectBucket.bucketArn}/client/*`],
            principals: [new iam.ServicePrincipal("cloudfront.amazonaws.com")],
            conditions: {
              StringEquals: {
                "AWS:SourceArn": `arn:aws:cloudfront::${this.account}:distribution/${this.cloudfrontDistribution.distributionId}`,
              },
            },
          }),
        ],
      }),
    });
  }
}
