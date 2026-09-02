#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";
import "dotenv/config";
import { IdentityStack } from "../lib/identity";
import { DatabaseStack } from "../lib/database";
import { WebStack } from "../lib/web";

const app = new cdk.App();
cdk.Tags.of(app).add("Project", "Itala");

new IdentityStack(app, "ItalaStagingIdentityStack", {
  env: {
    account: process.env.STAGING_ACCOUNT_ID,
    region: process.env.AWS_REGION,
  },
});

new DatabaseStack(app, "ItalaStagingDatabaseStack", {
  env: {
    account: process.env.STAGING_ACCOUNT_ID,
    region: process.env.AWS_REGION,
  },
});

new WebStack(app, "ItalaStagingWebStack", {
  env: {
    account: process.env.STAGING_ACCOUNT_ID,
    region: process.env.AWS_REGION,
  },
});
