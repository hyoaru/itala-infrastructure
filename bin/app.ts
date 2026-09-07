#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";
import "dotenv/config";
import { ApplicationStage } from "../lib/stages";
import { configurations } from "../lib/configurations";

const app = new cdk.App();
cdk.Tags.of(app).add("Project", "Itala");

const staging = new ApplicationStage(app, "ItalaStaging", {
  configuration: configurations.staging,
  env: {
    account: process.env.STAGING_ACCOUNT_ID,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
cdk.Tags.of(staging).add("Environment", "Staging");
