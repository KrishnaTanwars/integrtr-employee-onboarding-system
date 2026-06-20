# INTEGRTR Workflow Hub — Onboarding Automation Platform

A resilient, SaaS-grade onboarding orchestrator that integrates **SAP SuccessFactors** and **Slack Webhooks** using a robust transactional workflow engine backed by **Supabase PostgreSQL**.

---

## 📋 Problem Statement

Onboarding a new hire involves multiple downstream systems: SuccessFactors (the core HR system of record), app-specific databases, and team communications (Slack). A failure in any individual system (e.g. SuccessFactors credentials expire or a Slack webhook URL is deleted) leads to inconsistent data states. 

The **INTEGRTR Workflow Hub** solves this by implementing:
* **Transactional Reliability:** Decoupling operations from the HTTP client thread.
* **Idempotency Safeguards:** Preventing duplicate employee accounts on double submissions.
* **Step-Level Resiliency:** Tracking progress for each step and allowing target retries from where the failure occurred.

---

## ⚙️ Architecture & Tech Stack

```
        ┌───────────────────────────────────────────────┐
        │                 React Client                  │
        │           (Vite + Tailwind CSS V4)            │
        └──────────────────────┬────────────────────────┘
                               │ HTTP API / Polling (GET)
                               ▼
        ┌───────────────────────────────────────────────┐
        │            Express.js API Gateway             │
        └──────────────────────┬────────────────────────┘
                               │
                               ▼
        ┌───────────────────────────────────────────────┐
        │            Background Work Engine             │
        └──────┬────────────────┬────────────────┬──────┘
               │                │                │
               ▼                ▼                ▼
       ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
       │   Supabase   │ │     SAP      │ │    Slack     │
       │  PostgreSQL  │ │SuccessFactors│ │   Channels   │
       └──────────────┘ └──────────────┘ └──────────────┘
```

### Technical Stack
* **Frontend:** React 19, Vite 8, Tailwind CSS v4, Lucide Icons, Axios.
* **Backend:** Node.js, Express.js (v5), PG Connection Pool.
* **Database:** Supabase PostgreSQL (utilizing pgPool with SSL).
* **Integrations:** SAP SuccessFactors OData API, Slack Incoming Webhooks.

---

## 📊 Database Schema

We define a flat, reliable workflow ledger in PostgreSQL to track state across boundaries:

```sql
CREATE TABLE IF NOT EXISTS onboarding_requests (
    id VARCHAR(255) PRIMARY KEY,
    employee_name VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    idempotency_key VARCHAR(255) UNIQUE,
    initiated_by VARCHAR(255),
    created_at VARCHAR(255) NOT NULL,
    sf_employee_id VARCHAR(255),
    sf_status VARCHAR(50) DEFAULT 'pending',
    sf_error TEXT,
    slack_team_status VARCHAR(50) DEFAULT 'pending',
    slack_team_error TEXT,
    slack_hr_status VARCHAR(50) DEFAULT 'pending',
    slack_hr_error TEXT,
    slack_employee_status VARCHAR(50) DEFAULT 'pending',
    slack_employee_error TEXT,
    status VARCHAR(50) DEFAULT 'pending'
);
```

---

## 🛡️ Reliability Engineering Design

### 1. Idempotency Strategy
The system prevents double-onboarding through `idempotency_key` matching (generated using the client-side email signature and UUID parameters):
* If a duplicate key is submitted, the API returns the existing record immediately.
* If the existing workflow was interrupted/failed, the backend resumes the background task from where it left off, avoiding redundant API calls.

### 2. Asynchronous Background Execution
Onboarding requests return a response immediately (`200 OK`) as soon as the record is saved to the ledger. All downstream integrations run asynchronously on a background worker thread. The frontend polls the database every 3 seconds to update the UI dynamically.

### 3. Step-by-Step State Tracking
Every step writes its status (`success`, `failed`, `pending`) and precise exception logs directly into the PostgreSQL database. The overall record status is calculated dynamically based on individual steps:
* All success: status is `success`
* Any failure: status is `failed`
* Processing: status is `pending`

### 4. Recovery & Target Retries
If the pipeline fails (e.g. invalid Slack Webhook), the user can correct the environment settings and click **Retry**. The workflow engine skips all steps that are already marked `success` (preventing duplicate SuccessFactors user profiles) and retries the failed and subsequent steps only.

---

## 🎨 Visual Preview

* **SaaS Redesigned Dashboard:**
  ![Dashboard UI](/absolute/C:/Users/tanwa/.gemini/antigravity-ide/brain/9776d532-5883-4967-a1b9-4609315dd3ec/initial_dashboard_1781929829673.png)
  
* **Real-time Pending / Progress Steps:**
  ![Automation Active Progress](/absolute/C:/Users/tanwa/.gemini/antigravity-ide/brain/9776d532-5883-4967-a1b9-4609315dd3ec/pending_workflow_state_1781929939299.png)

* **Detailed Timeline Inspector:**
  ![Timeline Expanded Panel](/absolute/C:/Users/tanwa/.gemini/antigravity-ide/brain/9776d532-5883-4967-a1b9-4609315dd3ec/expanded_timeline_1781929963513.png)

---

## 🚀 Setup & Local Deployment

### Prerequisites
* Node.js v20+
* Docker Desktop (for local PostgreSQL testing) or a remote Supabase DB.

### 1. Database Setup (Local Docker fallback)
```bash
docker run -d --name local-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=postgres -p 5432:5432 postgres
```

### 2. Backend Server
1. Navigate to the server folder: `cd server`
2. Install dependencies: `npm install`
3. Configure environment variables in `server/.env`:
   ```env
   PORT=5000
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
   USE_MOCK_SF=true
   USE_MOCK_SLACK=true
   WORKFLOW_STEP_DELAY_MS=1000
   ```
4. Start the server: `npm start` (Runs automatic DB migration on start)

### 3. Frontend Client
1. Navigate to the client folder: `cd client`
2. Install dependencies: `npm install`
3. Create client configurations:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```
4. Run in development mode: `npm run dev`
