import { aws_dynamodb as dynamodb } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";

export class DatabaseStack extends cdk.Stack {
  public table: dynamodb.TableV2;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.table = new dynamodb.TableV2(this, "Table", {
      tableName: "itala",
      tableClass: dynamodb.TableClass.STANDARD,
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      timeToLiveAttribute: "ttl",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
      billing: dynamodb.Billing.onDemand(),
      encryption: dynamodb.TableEncryptionV2.awsManagedKey(),
      globalSecondaryIndexes: [
        {
          indexName: "TransactionByOccurredAt",
          partitionKey: { name: "GSI1PK", type: dynamodb.AttributeType.STRING },
          sortKey: { name: "GSI1SK", type: dynamodb.AttributeType.STRING },
        },
        {
          indexName: "TransactionByType",
          partitionKey: { name: "GSI2PK", type: dynamodb.AttributeType.STRING },
          sortKey: { name: "GSI2SK", type: dynamodb.AttributeType.STRING },
        },
        {
          indexName: "TransactionByAccount",
          partitionKey: { name: "GSI3PK", type: dynamodb.AttributeType.STRING },
          sortKey: { name: "GSI3SK", type: dynamodb.AttributeType.STRING },
        },
        {
          indexName: "TransactionByCategory",
          partitionKey: { name: "GSI4PK", type: dynamodb.AttributeType.STRING },
          sortKey: { name: "GSI4SK", type: dynamodb.AttributeType.STRING },
        },
      ],
    });
  }
}
