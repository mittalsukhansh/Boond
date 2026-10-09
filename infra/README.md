# Boond AWS Serverless Infrastructure Guide

> **Submission Track:** Heat & Water — Cyber AI Hackathon 2026  
> **Target Region:** `ap-south-1` (Asia Pacific - Mumbai)  
> **Cost Model:** 100% Free Tier Eligible ($0.00 / month idle cost)

---

## 1. System Architecture

Boond is architected as an event-driven, 100% serverless cloud application on Amazon Web Services:

![Boond AWS Serverless Architecture](architecture.svg)

### Service Mapping

| Component | AWS Service | Purpose | SLA / Performance |
|---|---|---|---|
| **Frontend UI** | **AWS Amplify Hosting** | Global static hosting for `web/index.html` via CloudFront CDN. | FCP &lt; 300 ms, automatic SSL |
| **API Ingestion** | **Amazon API Gateway (HTTP API v2)** | Serverless REST endpoint routing `/network` and `/scenario`. | Sub-50ms routing overhead, CORS |
| **Inference Microservice** | **AWS Lambda (Python 3.12)** | In-memory cached dataset lookup and demand cancellation execution. | Warm &lt; 5 ms, cold start &lt; 180 ms |
| **Dataset Storage** | **Amazon S3** | Encrypted, private bucket storing network topology and WNTR scenarios. | AES-256, Block Public Access |
| **Telemetry & Budgeting** | **Amazon CloudWatch** | Execution logs, 5% False Alarm Rate tracking, and budget alarms. | 1-minute metric granularity |

---

## 2. Prerequisites

1. **AWS Account:** Created via AWS Builder Center (Student verification profile or standard Free Tier).
2. **AWS CLI:** Installed and authenticated (`aws configure`) in `ap-south-1`.
3. **AWS SAM CLI:** Installed (`sam --version >= 1.100`).

---

## 3. Quick Deployment (AWS SAM)

### Step 1: Build & Deploy Backend Stack
From the repository root:

```bash
cd Boond/infra
sam build
sam deploy --guided
```

When prompted during `--guided`:
- **Stack Name:** `boond-stack`
- **AWS Region:** `ap-south-1`
- **Parameter Environment:** `prod`
- **Confirm changes before deploy:** `Y`
- **Allow SAM CLI IAM role creation:** `Y`
- **Disable rollback:** `N`

SAM will provision the S3 Bucket, HTTP API Gateway, and Lambda Function. Upon completion, note the `ApiEndpoint` and `S3BucketName` outputs.

---

### Step 2: Upload Simulation Datasets to S3

Upload the pre-computed WNTR hydraulic simulation datasets to your new S3 bucket:

```bash
# Replace <YOUR-S3-BUCKET-NAME> with the output from Step 1
aws s3 cp ../web/network.json s3://<YOUR-S3-BUCKET-NAME>/network.json
aws s3 cp ../web/scenarios.json s3://<YOUR-S3-BUCKET-NAME>/scenarios.json
aws s3 cp ../lambda/model.npz s3://<YOUR-S3-BUCKET-NAME>/model.npz
```

*Note: The Lambda function also includes a bundled copy in `lambda/data/` for instantaneous offline testing and zero-cold-start resiliency.*

---

### Step 3: Validate API Endpoints

Test the deployed HTTP API Gateway with `curl`:

```bash
# 1. Health check
curl "https://<YOUR-API-ID>.execute-api.ap-south-1.amazonaws.com/prod/health"

# 2. Network topology
curl "https://<YOUR-API-ID>.execute-api.ap-south-1.amazonaws.com/prod/network"

# 3. Burst scenario query
curl "https://<YOUR-API-ID>.execute-api.ap-south-1.amazonaws.com/prod/scenario?node=J-22&size=medium"
```

All responses will include the requisite CORS headers:
```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
```

---

### Step 4: Host Web Dashboard on AWS Amplify

The frontend has zero build steps (pure HTML/CSS/JavaScript).

#### Option A: Drag-and-Drop Zip (Fastest - under 2 minutes)
1. Zip the `Boond/web/` directory:
   ```bash
   cd Boond
   powershell Compress-Archive -Path web\* -DestinationPath web-dist.zip
   ```
2. Open the **AWS Amplify Console** in `ap-south-1`.
3. Click **Deploy without Git** &rarr; Name your app **Boond-Dashboard**.
4. Drag and drop `web-dist.zip` and click **Save and Deploy**.
5. Your public URL is immediately generated: `https://main.dXXXXXXXXXX.amplifyapp.com`.

#### Option B: Connect GitHub Repo
1. In Amplify Console, select **Host web app** &rarr; GitHub.
2. Select repository `Boond`, branch `main`.
3. Set the deploy directory to `web/` and build command to `none`.

---

### Step 5: Wire Frontend to Live API Gateway

Open [web/index.html](file:///d:/aws/cyber/Boond/web/index.html#L593) and set line 593:

```javascript
const API_BASE = "https://<YOUR-API-ID>.execute-api.ap-south-1.amazonaws.com/prod";
```

Push to GitHub or re-upload the zip to Amplify. The dashboard now runs against your live AWS serverless backend with automatic offline file fallback.

---

## 4. Cost, Security & Billing Alarms

### Zero-Cost Free Tier Guarantee
- **AWS Lambda:** 1,000,000 free requests per month, 3.2 million seconds of compute time.
- **Amazon API Gateway:** 1,000,000 free API calls per month on HTTP API.
- **Amazon S3:** Up to 5 GB standard storage free for 12 months (Boond datasets consume &lt; 1 MB total).
- **AWS Amplify:** 1,000 build minutes and 15 GB served per month free.

### Setup Billing Alarm (Safety First)
To avoid any billing surprises:
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name "Boond-Billing-Alarm" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --threshold 5.0 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --dimensions Name=Currency,Value=USD \
  --region us-east-1
```

---

## 5. Teardown / Cleanup

After hackathon evaluation, tear down all provisioned cloud resources in one command:

```bash
cd Boond/infra
sam delete --stack-name boond-stack --region ap-south-1
```
