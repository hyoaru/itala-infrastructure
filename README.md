# Itala Infrastructure

AWS CDK infrastructure-as-code for the [Itala](https://github.com/hyoaru/itala-pwa) personal finance platform. Defines the entire cloud stack across two environments (Staging and Production) using AWS CDK with TypeScript. Provisions infrastructure for the [API backend](https://github.com/hyoaru/itala-api), [workers](https://github.com/hyoaru/itala-workers), and [PWA frontend](https://github.com/hyoaru/itala-pwa).

## Architecture

Ten CDK stacks are orchestrated via an `ApplicationStage`, each instantiated for Staging and Production environments. The stacks handle DNS, bootstrap resources, Lambda workers, Cognito identity, DynamoDB storage, ACM certificates, CloudFront distribution, API Gateway, and CI/CD deployment roles.

Stack dependencies flow linearly: DNS → Bootstrap → Workers → Identity → Database → Web → API → Deployment.

### Platform Architecture

![Itala Infrastructure](docs/assets/Itala%20Infrastructure.png)

## Project Structure

```
itala-infrastructure/
├── bin/app.ts                          # CDK app entry point (Staging + Production)
├── lib/
│   ├── constants.ts                    # PARAMETER_BASE_PATH = "itala"
│   ├── stacks/
│   │   ├── dns.ts                      # Route 53 HostedZone
│   │   ├── bootstrap.ts                # S3 project bucket
│   │   ├── worker.ts                   # Pre/Post confirmation Lambda functions
│   │   ├── identity.ts                 # Cognito UserPool + Client
│   │   ├── database.ts                 # DynamoDB single-table
│   │   ├── web-certificate.ts          # ACM certificate (us-east-1 for CloudFront)
│   │   ├── web.ts                      # CloudFront Distribution + S3 origin
│   │   ├── api-certificate.ts          # ACM certificate (regional)
│   │   ├── api.ts                      # API Gateway HTTP API + Lambda
│   │   └── deployment.ts              # GitHub OIDC deploy role
│   ├── constructs/
│   │   ├── worker.ts                   # Generic Lambda + LogGroup construct
│   │   ├── pre-confirmation-sign-up.ts # Pre-signup worker construct
│   │   └── post-confirmation-sign-up.ts # Post-signup worker construct
│   └── stages/
│       └── application.ts              # ApplicationStage (orchestrates all stacks)
├── assets/
│   ├── api/function.zip                # Pre-built API Lambda artifact
│   └── worker/                         # Pre-built worker Lambda artifacts
├── docs/assets/                        # Architecture diagrams
├── .env.example                        # Required environment variables template
├── cdk.json                            # CDK app config and feature flags
└── package.json
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `APEX_DOMAIN` | Base domain for all subdomains |
| `STAGING_ACCOUNT_ID` | AWS account ID for staging |
| `PRODUCTION_ACCOUNT_ID` | AWS account ID for production |
| `CDK_DEFAULT_REGION` | AWS region (from CLI config) |

## Tech Stack

- **TypeScript** — infrastructure code
- **AWS CDK v2** — cloud development kit
- **Jest** — unit testing
- **dotenv** — environment variable loading

## Prerequisites

- Node.js
- AWS CLI configured for both staging and production accounts
- CDK bootstrap completed in each account/region

## CI/CD

The `DeploymentStack` creates an IAM Role (`ItalaGitHubDeployRole`) configured for GitHub Actions OIDC federation. It trusts repos under `hyoaru@*/itala-*` and grants permissions to:

- Upload artifacts to S3 (`client/`, `api/`, `worker/` prefixes)
- Update Lambda function code
- Invalidate CloudFront distributions
- Read SSM parameters under `/itala/*`

Deployment pipelines are defined in each sibling repository:
- [itala-pwa](https://github.com/hyoaru/itala-pwa) — frontend build → S3 → CloudFront
- [itala-api](https://github.com/hyoaru/itala-api) — Lambda build → S3 → Lambda update
- [itala-workers](https://github.com/hyoaru/itala-workers) — Lambda build → S3 → Lambda update

## SSM Parameters

All parameters use the base path `/itala/` and are written by CDK stacks:

| Parameter | Description |
|-----------|-------------|
| `/itala/table-name` | DynamoDB table name |
| `/itala/user-pool-id` | Cognito User Pool ID |
| `/itala/user-pool-client-id` | Cognito User Pool Client ID |
| `/itala/client-artifact-s3-uri` | S3 URI for PWA build artifact |
| `/itala/cloudfront-distribution-id` | CloudFront Distribution ID |
| `/itala/api-base-url` | API Gateway base URL |
| `/itala/api-function-name` | API Lambda function name |
| `/itala/api-function-s3-uri` | S3 URI for API function.zip |
| `/itala/worker/*/function-name` | Worker Lambda function names |
| `/itala/worker/*/function-s3-uri` | S3 URIs for worker artifacts |
