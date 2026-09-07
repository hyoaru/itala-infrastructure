import { aws_s3 as s3 } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";

import {
  PostConfirmationSignUpWorker,
  PreConfirmationSignUpWorker,
} from "../constructs";

interface WorkerStackProps extends cdk.StackProps {
  environment: string;
  projectBucket: s3.Bucket;
}

export class WorkerStack extends cdk.Stack {
  public readonly preConfirmationSignUpWorker: PreConfirmationSignUpWorker;
  public readonly postConfirmationSignUpWorker: PostConfirmationSignUpWorker;

  constructor(scope: Construct, id: string, props: WorkerStackProps) {
    super(scope, id, props);

    this.preConfirmationSignUpWorker = new PreConfirmationSignUpWorker(this, {
      projectBucket: props.projectBucket,
      environment: props.environment,
    });

    this.postConfirmationSignUpWorker = new PostConfirmationSignUpWorker(this, {
      projectBucket: props.projectBucket,
      environment: props.environment,
    });
  }
}
