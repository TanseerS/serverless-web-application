# serverless-web-application

A simple full-stack web application deployed on AWS using IaC — Terraform.

A minimal tasks (todo) app. The website is intentionally simple — the focus of this repo is the **Terraform** in [infrastructure/](infrastructure/), built as reusable modules across `dev` / `staging` / `prod` environments with remote state.

## Architecture

![Architecture diagram](docs/architecture.png)

Users hit the React frontend on **Amplify** (which builds from **GitHub** on push); the app calls **API Gateway**, which invokes a **Lambda** function running the Express API, which talks to **RDS MySQL**.

- **Frontend** — React + Vite ([frontend/](frontend/)), hosted on **Amplify**.
- **Backend** — Node.js + Express + Sequelize ([backend/](backend/)), packaged as a zip and run on **Lambda** behind **API Gateway**.
- **Database** — **RDS MySQL**, with credentials stored in **Secrets Manager** and fetched by Lambda at runtime.

## AWS services used

### S3 — two purposes
- **Bootstrap bucket** — stores Terraform **state files**. Created once by [infrastructure/bootstrap/](infrastructure/bootstrap/) before any environment is applied.
- **Artifact bucket** — created by the **backend module**, stores the **Lambda deployment zip**.

Both are just object storage. S3 is the natural fit for both because state files and zip artifacts are just files that need to persist reliably.

### Secrets Manager
Stores the RDS **username, password, host, port, and database name** as a single JSON secret. Lambda fetches this at runtime via an SDK call. The password never sits in an environment variable or in plaintext in the console.

### RDS MySQL
The data tier. A managed relational database, so you don't handle patching, backups, or engine installation. MySQL because the backend code is already written against it.

For **dev**: single AZ, `db.t3.micro`, no multi-AZ standby — keeps cost near zero.

### Lambda
Runs the backend API code. No servers to manage, no EC2 to keep running — you pay only when requests come in, which is effectively free under the free tier for a dev/portfolio project.

All **five API routes funnel into one Lambda function**: API Gateway handles routing, Lambda handles the logic.

### API Gateway
Sits in front of Lambda and gives you a real **HTTPS endpoint**. Handles request routing, method matching (`GET /api/tasks`, `POST /api/tasks`, etc.) and Lambda invocation. Without it, the Lambda has no public URL.

**REST API** type specifically — gives full control over resources and methods, which maps cleanly to the five routes.

### IAM
Not a service you call explicitly, but every Lambda needs an **execution role**. This one has three scoped permissions:

- `secretsmanager:GetSecretValue` on the specific DB secret
- `s3:GetObject` on the artifact bucket (Lambda reads its own zip during deployment)
- Basic Lambda execution permissions for CloudWatch Logs

Least privilege — nothing broader than what the function actually needs.

### Amplify
Hosts the React frontend. Connects to the GitHub repo, builds on push, and serves over HTTPS with a CDN in front. No S3 static-hosting setup, no CloudFront config — Amplify handles all of it.

Takes the API Gateway URL as an **environment variable at build time** so the React app knows where to send requests.

### CloudWatch Logs
Automatic — Lambda writes logs here by default. Not configured explicitly in Terraform, but it's what you'll use to debug the Lambda during development. The IAM execution role grants the permission to write here.

## API endpoints

| Method | Path             | Description                  |
|--------|------------------|------------------------------|
| GET    | `/api/health`    | Liveness + DB connectivity   |
| GET    | `/api/tasks`     | List all tasks               |
| POST   | `/api/tasks`     | Create a task `{ title }`    |
| PUT    | `/api/tasks/:id` | Update `{ title, completed }`|
| DELETE | `/api/tasks/:id` | Delete a task                |

## Project layout

```
tasks-app/
├── frontend/                        # React app (already exists)
├── backend/                         # Lambda function code (already exists)
└── infrastructure/
    ├── bootstrap/                   # run once to create S3 tfstate bucket
    │   ├── main.tf
    │   ├── variables.tf
    │   └── README.md
    │
    ├── modules/                     # reusable, no state, no backend
    │   ├── database/
    │   │   ├── main.tf              # RDS MySQL + Secrets Manager + SG
    │   │   ├── variables.tf
    │   │   └── outputs.tf
    │   ├── backend/
    │   │   ├── main.tf              # S3 artifact bucket + Lambda + API Gateway + IAM
    │   │   ├── variables.tf
    │   │   └── outputs.tf
    │   └── frontend/
    │       ├── main.tf              # Amplify app + branch
    │       ├── variables.tf
    │       └── outputs.tf
    │
    └── environments/
        ├── dev/
        │   ├── main.tf              # calls all three modules
        │   ├── variables.tf         # declares input variables
        │   ├── outputs.tf           # expose useful values after apply
        │   ├── providers.tf         # AWS provider + version constraints
        │   ├── backend.tf           # S3 remote backend for dev state
        │   ├── terraform.tfvars     # actual values — gitignored
        │   └── terraform.tfvars.example  # committed, documents required vars
        ├── staging/                 # same structure as dev
        │   └── ...
        └── prod/                    # same structure as dev
            └── ...
```

- **`bootstrap/`** — run once, before anything else, to create the S3 bucket that holds Terraform state for the environments.
- **`modules/`** — reusable building blocks with no state or backend of their own: `database` (RDS MySQL + Secrets Manager + security group), `backend` (S3 artifact bucket + Lambda + API Gateway + IAM), `frontend` (Amplify app + branch). Called by environments.
- **`environments/`** — one directory per environment (`dev` / `staging` / `prod`), each calling the three modules with its own values, provider config, and remote-state backend. `terraform.tfvars` is gitignored; `terraform.tfvars.example` is committed to document the required vars.

## Local development

```bash
# Backend (needs a local MySQL, see backend/.env.example)
cd backend && npm install && cp .env.example .env && npm run dev

# Frontend (talks to http://localhost:3000 by default)
cd frontend && npm install && npm run dev
```

The backend retries the DB connection on startup and runs `sequelize.sync()`, so the `tasks` table is created automatically — you only need to create the database itself.

## Notes

- Everything is sized for a demo: `db.t3.micro`, single AZ, Lambda + free-tier services — cheap, but not production-grade.
- The frontend (Amplify) and API (API Gateway) are both served over HTTPS out of the box.
