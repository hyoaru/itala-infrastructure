import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import {
  ApiStack,
  BootstrapStack,
  DatabaseStack,
  DeploymentStack,
  IdentityStack,
  WebStack,
} from "../stacks";

export class ApplicationStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    const bootstrapStack = new BootstrapStack(this, "Bootstrap");
    const identityStack = new IdentityStack(this, "Identity");
    const databaseStack = new DatabaseStack(this, "Database");

    const webStack = new WebStack(this, "Web", {
      projectBucket: bootstrapStack.projectBucket,
    });

    const apiStack = new ApiStack(this, "Api", {
      projectBucket: bootstrapStack.projectBucket,
      userPool: identityStack.userPool,
      dynamodbTable: databaseStack.table,
      cloudfrontDistribution: webStack.cloudfrontDistribution,
    });

    new DeploymentStack(this, "Deployment", {
      projectBucket: bootstrapStack.projectBucket,
      cloudfrontDistribution: webStack.cloudfrontDistribution,
      apiFunction: apiStack.apiFunction,
    });
  }
}
