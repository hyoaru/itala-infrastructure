import * as cdk from "aws-cdk-lib/core";

export type Configuration = {
  environment: string;
  removalPolicy: cdk.RemovalPolicy;
};
