import {
  aws_apigatewayv2 as apigateway,
  aws_apigatewayv2_integrations as apigatewayIntegrations,
  aws_dynamodb as dynamodb,
  aws_lambda as lambda,
  aws_logs as logs,
  aws_ssm as ssm,
} from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import { PARAMETER_BASE_PATH } from "../constants";

interface ApiStackProps extends cdk.StackProps {
  dynamodbTable: dynamodb.Table;
}

export class ApiStack extends cdk.Stack {
  public readonly apiGateway: apigateway.HttpApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const logGroup = new logs.LogGroup(this, "ApiLogGroup", {
      logGroupName: `/aws/lambda/itala/api`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const apiFunction = new lambda.Function(this, "ApiFunction", {
      runtime: lambda.Runtime.PROVIDED_AL2023,
      architecture: lambda.Architecture.ARM_64,
      handler: "main",
      code: lambda.Code.fromInline("initialize"),
      loggingFormat: lambda.LoggingFormat.JSON,
      applicationLogLevelV2: lambda.ApplicationLogLevel.INFO,
      systemLogLevelV2: lambda.SystemLogLevel.INFO,
      logGroup: logGroup,
    });

    props.dynamodbTable.grantReadWriteData(apiFunction);

    this.apiGateway = new apigateway.HttpApi(this, "ApiGateway", {
      createDefaultStage: true,
    });

    this.apiGateway.addRoutes({
      path: "/{proxy+}",
      methods: [apigateway.HttpMethod.ANY],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        "ApiIntegration",
        apiFunction,
      ),
    });

    new ssm.StringParameter(this, "ApiUrlParameter", {
      parameterName: `/${PARAMETER_BASE_PATH}/api-base-url`,
      stringValue: this.apiGateway.url!,
    });
  }
}
