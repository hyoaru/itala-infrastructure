import { aws_lambda as lambda, aws_logs as logs } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";

interface WorkerProps {
  logGroup: { name: string };
  function: {
    name: string;
    code: lambda.Code;
    environment: Record<string, string>;
  };
}

export class Worker extends Construct {
  public readonly logGroup: logs.LogGroup;
  public readonly function: lambda.Function;

  constructor(scope: Construct, id: string, props: WorkerProps) {
    super(scope, id);

    this.logGroup = new logs.LogGroup(this, `${id}LogGroup`, {
      logGroupName: props.logGroup.name,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.function = new lambda.Function(this, `${id}Function`, {
      functionName: props.function.name,
      runtime: lambda.Runtime.PROVIDED_AL2023,
      architecture: lambda.Architecture.ARM_64,
      handler: "main",
      code: props.function.code,
      loggingFormat: lambda.LoggingFormat.JSON,
      applicationLogLevelV2: lambda.ApplicationLogLevel.INFO,
      systemLogLevelV2: lambda.SystemLogLevel.INFO,
      logGroup: this.logGroup,
      environment: props.function.environment,
    });
  }
}
