import {
  aws_lambda as lambda,
  aws_s3 as s3,
  aws_ssm as ssm,
} from "aws-cdk-lib";
import { Construct } from "constructs";

import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import { PARAMETER_BASE_PATH } from "../constants";
import { Worker } from "./worker";

interface PreConfirmationSignUpWorkerProps {
  environment: string;
  projectBucket: s3.Bucket;
}

export class PreConfirmationSignUpWorker extends Construct {
  public readonly worker: Worker;

  constructor(scope: Construct, props: PreConfirmationSignUpWorkerProps) {
    super(scope, "PreConfirmationSignUpWorker");

    const workerFunctionArtifact = new s3deploy.BucketDeployment(
      this,
      `${this.node.id}Artifact`,
      {
        sources: [
          s3deploy.Source.asset("./assets/worker/pre-confirmation-sign-up"),
        ],
        destinationBucket: props.projectBucket,
        destinationKeyPrefix: "worker/pre-confirmation-sign-up/latest",
      },
    );

    const discordWebhookUrlParameter =
      ssm.StringParameter.valueForStringParameter(
        this,
        `/${PARAMETER_BASE_PATH}/worker/pre-confirmation-sign-up/discord-webhook-url`,
      );

    this.worker = new Worker(this, this.node.id, {
      logGroup: {
        name: "/aws/lambda/itala/worker/pre-confirmation-sign-up",
      },
      function: {
        name: "ItalaWorkerPreConfirmationSignUpFunction",
        code: lambda.Code.fromBucketV2(
          props.projectBucket,
          "worker/pre-confirmation-sign-up/latest/function.zip",
        ),
        environment: {
          ENVIRONMENT: props.environment,
          DISCORD_WEBHOOK_URL: discordWebhookUrlParameter,
        },
      },
    });

    const workerFunctionArtifactS3UriBase = `s3://${props.projectBucket.bucketName}/worker/pre-confirmation-sign-up`;

    new ssm.StringParameter(this, `${this.node.id}FunctionNameParameter`, {
      parameterName: `/${PARAMETER_BASE_PATH}/worker/pre-confirmation-sign-up/function-name`,
      stringValue: this.worker.function.functionName,
    });

    new ssm.StringParameter(this, `${this.node.id}FunctionsS3UriParameter`, {
      parameterName: `/${PARAMETER_BASE_PATH}/worker/pre-confirmation-sign-up/function-s3-uri`,
      stringValue: `${workerFunctionArtifactS3UriBase}/latest/function.zip`,
    });

    new ssm.StringParameter(this, `${this.node.id}FunctionS3UriBaseParameter`, {
      parameterName: `/${PARAMETER_BASE_PATH}/worker/pre-confirmation-sign-up/function-s3-uri-base`,
      stringValue: workerFunctionArtifactS3UriBase,
    });

    this.worker.function.node.addDependency(workerFunctionArtifact);
    props.projectBucket.grantRead(
      this.worker.function,
      `${workerFunctionArtifactS3UriBase}/latest/function.zip`,
    );
  }
}
