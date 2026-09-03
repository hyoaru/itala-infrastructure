import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import {
  ApiStack,
  DatabaseStack,
  DeploymentStack,
  IdentityStack,
  WebStack,
} from "../stacks";

export class ApplicationStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    new IdentityStack(this, "Identity");
    const databaseStack = new DatabaseStack(this, "Database");
    new ApiStack(this, "Api", { dynamodbTable: databaseStack.table });
    const webStack = new WebStack(this, "Web");

    new DeploymentStack(this, "Deployment", {
      clientArtifactBucket: webStack.bucket,
      clientDistribution: webStack.distribution,
    });
  }
}
