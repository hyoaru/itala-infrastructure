import {
  aws_iam as iam,
  aws_s3 as s3,
  aws_cloudfront as cloudfront,
} from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";

interface DeploymentStackProps extends cdk.StackProps {
  clientArtifactBucket: s3.Bucket;
  clientDistribution: cloudfront.Distribution;
}

export class DeploymentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DeploymentStackProps) {
    super(scope, id, props);

    const githubOidcProviderArn = cdk.Fn.importValue("GithubOidcProviderArn");

    const deployRole = new iam.Role(this, "GitHubDeployRole", {
      roleName: "GitHubDeployRole",

      assumedBy: new iam.FederatedPrincipal(
        githubOidcProviderArn,
        {
          StringEquals: {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          },
          StringLike: {
            "token.actions.githubusercontent.com:sub": [
              "repo:hyoaru/itala-pwa:*",
              "repo:hyoaru/itala-api:*",
            ],
          },
        },
        "sts:AssumeRoleWithWebIdentity",
      ),
    });

    props.clientArtifactBucket.grantReadWrite(deployRole);
    props.clientDistribution.grantCreateInvalidation(deployRole);

    new cdk.CfnOutput(this, "DeploymentRoleArn", {
      value: deployRole.roleArn,
      exportName: "ItalaDeploymentRoleArn",
    });
  }
}
