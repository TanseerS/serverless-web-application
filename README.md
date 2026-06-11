# serverless-web-application

A simple full-stack web application deployed on AWS using IaC — Terraform.

A minimal tasks (todo) app: the website is intentionally simple — the focus of this repo is the **Terraform** in [infrastructure/](infrastructure/).

## Architecture

```
                        ┌─────────────────────────────────────────────┐
                        │                  AWS (VPC)                  │
   Browser ──────────►  S3 static website (React build)              │
      │                 │                                             │
      │  HTTP :3000     │  ┌──────────────┐        ┌───────────────┐  │
      └───────────────► │  │ EC2 (public  │ :3306  │ RDS MySQL     │  │
                        │  │ subnet)      ├───────►│ (private      │  │
                        │  │ Express API  │        │ subnets)      │  │
                        │  └──────────────┘        └───────────────┘  │
                        └─────────────────────────────────────────────┘
```

- **Frontend** — React + Vite ([frontend/](frontend/)), built and uploaded to an S3 bucket with static website hosting.
- **Backend** — Node.js + Express + Sequelize ([backend/](backend/)). Terraform zips it, uploads it to an artifacts S3 bucket, and the EC2 instance downloads and runs it as a systemd service on boot.
- **Database** — RDS MySQL 8 in private subnets, reachable only from the EC2 security group.

## API endpoints

| Method | Path             | Description                  |
|--------|------------------|------------------------------|
| GET    | `/api/health`    | Liveness + DB connectivity   |
| GET    | `/api/tasks`     | List all tasks               |
| POST   | `/api/tasks`     | Create a task `{ title }`    |
| PUT    | `/api/tasks/:id` | Update `{ title, completed }`|
| DELETE | `/api/tasks/:id` | Delete a task                |

## Deploy to AWS

Prerequisites: Terraform >= 1.5, Node.js 18+, AWS CLI configured with credentials.

```bash
# 1. Provision everything (VPC, EC2, RDS, S3) — RDS takes ~5-10 minutes
cd infrastructure
terraform init
terraform apply

# 2. Build the frontend against the new API URL and upload it to S3
cd ..
./scripts/deploy-frontend.sh

# 3. Open the site
terraform -chdir=infrastructure output -raw frontend_url
```

The EC2 instance bootstraps itself on first boot (installs Node, downloads the backend from S3, starts a systemd service), so give it a minute or two after `apply` before the API responds. The DB password is auto-generated: `terraform output db_password`.

No SSH keys are created — debug the instance with SSM instead:

```bash
aws ssm start-session --target $(terraform -chdir=infrastructure output -raw api_instance_id)
# then: sudo journalctl -u backend -f
```

### Redeploying the backend

Change code in `backend/`, then `terraform apply` — the artifact hash is embedded in user data, so the instance is replaced and boots with the new code (the Elastic IP, and therefore the API URL, stays the same).

### Tear down

```bash
terraform -chdir=infrastructure destroy
```

## Terraform layout

| File                  | Purpose                                            |
|-----------------------|----------------------------------------------------|
| `versions.tf`         | Provider requirements + AWS provider config        |
| `variables.tf`        | Input variables (region, names, sizes)             |
| `network.tf`          | VPC, public/private subnets, IGW, route tables     |
| `security.tf`         | Security groups (API: 3000 from world; RDS: 3306 from API only) |
| `rds.tf`              | MySQL instance, subnet group, generated password   |
| `ec2.tf`              | Backend zip + S3 artifact, IAM role, EC2, EIP      |
| `user_data.sh.tpl`    | Instance bootstrap script (template)               |
| `frontend.tf`         | S3 static website bucket + public read policy      |
| `outputs.tf`          | URLs, bucket name, DB endpoint/password            |

## Local development

```bash
# Backend (needs a local MySQL, see backend/.env.example)
cd backend && npm install && cp .env.example .env && npm run dev

# Frontend (talks to http://localhost:3000 by default)
cd frontend && npm install && npm run dev
```

## Notes

- Everything is sized for a demo: `t3.micro`, `db.t3.micro`, single AZ, no NAT gateway — cheap, but not production-grade.
- The site is served over plain HTTP (S3 website endpoint + EC2 IP). Adding CloudFront + ACM would give HTTPS but is out of scope for this demo.
