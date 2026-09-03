import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import { DatabaseStack, IdentityStack, WebStack } from "../stacks";

export class ApplicationStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    new IdentityStack(this, "Identity");
    new DatabaseStack(this, "Database");
    new WebStack(this, "Web");
  }
}
