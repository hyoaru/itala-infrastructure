import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import {
  ApiStack,
  BootstrapStack,
  DatabaseStack,
  DeploymentStack,
  IdentityStack,
  WebStack,
  WorkerStack,
} from "../stacks";
import type { Configuration } from "../configurations";

interface ApplicationStageProps extends cdk.StageProps {
  configuration: Configuration;
}

export class ApplicationStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: ApplicationStageProps) {
    super(scope, id, props);

    const bootstrapStack = new BootstrapStack(this, "Bootstrap", {
      removalPolicy: props.configuration.removalPolicy,
    });

    const workerStack = new WorkerStack(this, "Worker", {
      environment: props.configuration.environment,
      projectBucket: bootstrapStack.projectBucket,
    });

    const identityStack = new IdentityStack(this, "Identity", {
      removalPolicy: props.configuration.removalPolicy,
      preConfirmationTriggerFunction:
        workerStack.preConfirmationSignUpWorker.worker.function,
      postConfirmationTriggerFunction:
        workerStack.postConfirmationSignUpWorker.worker.function,
    });

    const databaseStack = new DatabaseStack(this, "Database", {
      removalPolicy: props.configuration.removalPolicy,
    });

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
      workers: [workerStack.preConfirmationSignUpWorker.worker],
    });
  }
}
