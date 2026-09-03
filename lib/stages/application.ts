import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import {
  DatabaseStack,
  DeploymentStack,
  IdentityStack,
  WebStack,
} from "../stacks";

export class ApplicationStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    new IdentityStack(this, "Identity");
    new DatabaseStack(this, "Database");
    const webStack = new WebStack(this, "Web");

    new DeploymentStack(this, "Deployment", {
      clientArtifactBucket: webStack.bucket,
      clientDistribution: webStack.distribution,
    });
  }
}
