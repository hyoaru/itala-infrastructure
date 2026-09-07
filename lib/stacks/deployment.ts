import {
  aws_cloudfront as cloudfront,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_s3 as s3,
} from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import { PARAMETER_BASE_PATH } from "../constants";
import { Worker } from "../constructs";

interface DeploymentStackProps extends cdk.StackProps {
  projectBucket: s3.Bucket;
  cloudfrontDistribution: cloudfront.Distribution;
  apiFunction: lambda.Function;
  workers: Worker[];
}

export class DeploymentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DeploymentStackProps) {
    super(scope, id, props);

    const githubOidcProviderArn = cdk.Fn.importValue("GithubOidcProviderArn");

    const deployRole = new iam.Role(this, "GitHubDeployRole", {
      roleName: "ItalaGitHubDeployRole",

      assumedBy: new iam.FederatedPrincipal(
        githubOidcProviderArn,
        {
          StringEquals: {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          },
          StringLike: {
            "token.actions.githubusercontent.com:sub": [
              "repo:hyoaru@*/itala-pwa@*:environment:*",
              "repo:hyoaru@*/itala-api@*:environment:*",
              "repo:hyoaru@*/itala-workers@*:environment:*",
            ],
          },
        },
        "sts:AssumeRoleWithWebIdentity",
      ),
    });

    props.projectBucket.grantReadWrite(deployRole, "client/*");
    props.projectBucket.grantDelete(deployRole, "client/*");
    props.projectBucket.grantReadWrite(deployRole, "api/*");
    props.projectBucket.grantDelete(deployRole, "api/*");
    props.projectBucket.grantReadWrite(deployRole, "worker/*");
    props.projectBucket.grantDelete(deployRole, "worker/*");
    props.cloudfrontDistribution.grantCreateInvalidation(deployRole);

    deployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["lambda:UpdateFunctionCode"],
        resources: [props.apiFunction.functionArn],
      }),
    );

    props.workers.forEach((worker) => {
      deployRole.addToPolicy(
        new iam.PolicyStatement({
          actions: ["lambda:UpdateFunctionCode"],
          resources: [worker.function.functionArn],
        }),
      );
    });

    deployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["ssm:GetParameter"],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/${PARAMETER_BASE_PATH}/*`,
        ],
      }),
    );
  }
}
