import * as cdk from "aws-cdk-lib/core";
import { Configuration } from "./type";

export const StagingConfiguration: Configuration = {
  environment: "staging",
  removalPolicy: cdk.RemovalPolicy.DESTROY,
};
