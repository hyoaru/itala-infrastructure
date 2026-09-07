import * as cdk from "aws-cdk-lib/core";
import { Configuration } from "./type";

export const ProductionConfiguration: Configuration = {
  environment: "production",
  removalPolicy: cdk.RemovalPolicy.DESTROY,
};
