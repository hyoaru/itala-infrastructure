#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";
import "dotenv/config";
import { IdentityStack } from "../lib/identity";

const app = new cdk.App();
new IdentityStack(app, "ItalaStagingIdentityStack", {
  env: {
    account: process.env.STAGING_ACCOUNT_ID,
    region: process.env.AWS_REGION,
  },
});
