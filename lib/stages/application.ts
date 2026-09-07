import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import {
  ApiCertificate,
  ApiStack,
  BootstrapStack,
  DatabaseStack,
  DeploymentStack,
  DnsStack,
  IdentityStack,
  WebCertificate,
  WebStack,
  WorkerStack,
} from "../stacks";

interface ApplicationStageProps extends cdk.StageProps {
  environment: string;
  removalPolicy: cdk.RemovalPolicy;
  zoneName: string;
}

export class ApplicationStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: ApplicationStageProps) {
    super(scope, id, props);

    const dnsStack = new DnsStack(this, "Dns", {
      zoneName: props.zoneName,
    });

    const bootstrapStack = new BootstrapStack(this, "Bootstrap", {
      removalPolicy: props.removalPolicy,
    });

    const workerStack = new WorkerStack(this, "Worker", {
      environment: props.environment,
      projectBucket: bootstrapStack.projectBucket,
    });

    const identityStack = new IdentityStack(this, "Identity", {
      removalPolicy: props.removalPolicy,
      preConfirmationTriggerFunction:
        workerStack.preConfirmationSignUpWorker.worker.function,
      postConfirmationTriggerFunction:
        workerStack.postConfirmationSignUpWorker.worker.function,
    });

    const databaseStack = new DatabaseStack(this, "Database", {
      removalPolicy: props.removalPolicy,
    });

    const webCertificateStack = new WebCertificate(this, "WebCertificate", {
      env: { account: this.account, region: "us-east-1" },
      hostedZone: dnsStack.hostedZone,
    });

    const webStack = new WebStack(this, "Web", {
      hostedZone: dnsStack.hostedZone,
      projectBucket: bootstrapStack.projectBucket,
      certificateArn: webCertificateStack.certificate.certificateArn,
    });

    const apiCertificateStack = new ApiCertificate(this, "ApiCertificate", {
      hostedZone: dnsStack.hostedZone,
    });

    const apiStack = new ApiStack(this, "Api", {
      hostedZone: dnsStack.hostedZone,
      projectBucket: bootstrapStack.projectBucket,
      userPool: identityStack.userPool,
      dynamodbTable: databaseStack.table,
      cloudfrontDistribution: webStack.cloudfrontDistribution,
      certificateArn: apiCertificateStack.certificate.certificateArn,
    });

    new DeploymentStack(this, "Deployment", {
      projectBucket: bootstrapStack.projectBucket,
      cloudfrontDistribution: webStack.cloudfrontDistribution,
      apiFunction: apiStack.apiFunction,
      workers: [
        workerStack.preConfirmationSignUpWorker.worker,
        workerStack.postConfirmationSignUpWorker.worker,
      ],
    });
  }
}
