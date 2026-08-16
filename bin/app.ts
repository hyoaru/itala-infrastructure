#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";
import { InfrastructureStack } from "../lib/stacks/infrastructure";

const app = new cdk.App();
new InfrastructureStack(app, "ItalaInfrastructureStack", {
  env: {
    account: process.env.TOOLING_ACCOUNT_ID,
    region: process.env.AWS_REGION,
  },
});
