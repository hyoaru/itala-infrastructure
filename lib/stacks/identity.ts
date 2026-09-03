import { aws_cognito as cognito } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";

export class IdentityStack extends cdk.Stack {
  public userPool: cognito.UserPool;
  public userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: "itala",
      signInAliases: { email: true },
      selfSignUpEnabled: true,
      autoVerify: { email: true },
      mfa: cognito.Mfa.OFF,
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      customAttributes: {
        first_name: new cognito.StringAttribute({
          minLen: 1,
          maxLen: 50,
          mutable: true,
        }),
        last_name: new cognito.StringAttribute({
          minLen: 1,
          maxLen: 100,
          mutable: true,
        }),
      },
      email: cognito.UserPoolEmail.withCognito(),
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      deviceTracking: {
        challengeRequiredOnNewDevice: false,
        deviceOnlyRememberedOnUserPrompt: false,
      },
      featurePlan: cognito.FeaturePlan.ESSENTIALS,
    });

    this.userPoolClient = this.userPool.addClient("PWAClient", {
      userPoolClientName: "itala-pwa",
      generateSecret: false,
      enableTokenRevocation: true,
      preventUserExistenceErrors: true,
      refreshTokenValidity: cdk.Duration.days(5),
      refreshTokenRotationGracePeriod: cdk.Duration.seconds(10),
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      authFlows: { userPassword: true, userSrp: true, user: true },
    });
  }
}
