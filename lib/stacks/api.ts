import {
  aws_apigatewayv2 as apigateway,
  aws_apigatewayv2_integrations as apigatewayIntegrations,
  aws_dynamodb as dynamodb,
  aws_lambda as lambda,
  aws_logs as logs,
  aws_s3 as s3,
  aws_ssm as ssm,
  aws_cognito as cognito,
} from "aws-cdk-lib";

import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import { PARAMETER_BASE_PATH } from "../constants";

interface ApiStackProps extends cdk.StackProps {
  projectBucket: s3.Bucket;
  userPool: cognito.UserPool;
  dynamodbTable: dynamodb.TableV2;
}

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const logGroup = new logs.LogGroup(this, "ApiLogGroup", {
      logGroupName: `/aws/lambda/itala/api`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const apiArtifact = new s3deploy.BucketDeployment(this, "ApiArtifact", {
      sources: [s3deploy.Source.asset("./assets/api")],
      destinationBucket: props.projectBucket,
      destinationKeyPrefix: "api",
    });

    const apiFunction = new lambda.Function(this, "ApiFunction", {
      runtime: lambda.Runtime.PROVIDED_AL2023,
      architecture: lambda.Architecture.ARM_64,
      handler: "main",
      code: lambda.Code.fromBucketV2(props.projectBucket, "api/function.zip"),
      loggingFormat: lambda.LoggingFormat.JSON,
      applicationLogLevelV2: lambda.ApplicationLogLevel.INFO,
      systemLogLevelV2: lambda.SystemLogLevel.INFO,
      logGroup: logGroup,
      environment: {
        COGNITO_USER_POOL_ID: props.userPool.userPoolId,
        DYNAMODB_TABLE_NAME: props.dynamodbTable.tableName,
      },
    });

    new ssm.StringParameter(this, "ApiFunctionS3Uri", {
      parameterName: `/${PARAMETER_BASE_PATH}/api-function-s3-uri`,
      stringValue: `s3://${props.projectBucket.bucketName}}/api/function.zip`,
    });

    apiFunction.node.addDependency(apiArtifact);
    props.projectBucket.grantRead(apiFunction, "api/function.zip");
    props.dynamodbTable.grantReadWriteData(apiFunction);

    const apiGateway = new apigateway.HttpApi(this, "ApiGateway", {
      apiName: "itala",
      createDefaultStage: true,
    });

    apiGateway.addRoutes({
      path: "/{proxy+}",
      methods: [apigateway.HttpMethod.ANY],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        "ApiIntegration",
        apiFunction,
      ),
    });

    new ssm.StringParameter(this, "ApiBaseUrlParameter", {
      parameterName: `/${PARAMETER_BASE_PATH}/api-base-url`,
      stringValue: apiGateway.url!,
    });
  }
}
