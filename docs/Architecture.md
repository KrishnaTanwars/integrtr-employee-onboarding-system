# System Architecture Documentation

This document describes the architectural specifications of the **INTEGRTR Onboarding Workflow Automation Platform**.

---

## 🏛️ System Overview

The system utilizes an asynchronous decoupled architecture where the API gateway accepts request payloads, persists the execution state to a transactional relational database, and delegates integration work to an asynchronous background executor.

```
       [ Client React App ]
                 │
                 │ HTTP (POST/GET)
                 ▼
     [ Express App Gateway ]
        /                 \
       /                   \  Trigger (Async / Background)
      ▼                     ▼
[ PostgreSQL DB ]   [ Background Workflow Engine ]
                            │
                            ├─► [ SuccessFactors Adapter ] ──► SAP OData
                            ├─► [ Slack Team Webhook ] ──────► Team Channel
                            ├─► [ Slack HR Webhook ] ────────► HR Channel
                            └─► [ Slack Employee Webhook ] ──► Direct Msg
```

---

## 💻 1. React Frontend

The React application is built on **React 19 + Vite 8** with styling powered by **Tailwind CSS v4** and iconography from **Lucide Icons**.

* **State Architecture:**
  - `data` state: Holds the active collection of onboarding pipelines.
  - `searchQuery` and `deptFilter` states: Computes client-side queries dynamically.
  - `expandedId` state: Controls the selected onboarding request row to view detailed vertical timeline progress.
* **Polling Loop:**
  - The dashboard executes a background polling interval query (`fetchData(false)`) every **3 seconds** to retrieve the latest backend state from `GET /api/onboarding`.
  - When the operator clicks **Submit** or **Retry**, the table row transitions to "Processing" while the client-side loop updates statuses smoothly in real-time.

---

## 🔌 2. Express Backend (API Gateway)

The backend is built on **Express.js (v5)** using ECMAScript modules (`import/export` syntax).

* **Router Pipelines:** Defined in [onboardingRoutes.js](file:///e:/PROJECTS/INTEGRTRxGLAU26/gla_hackathon_2026_team_09/server/src/routes/onboardingRoutes.js):
  - `GET /onboarding`: Lists all active records.
  - `POST /onboarding/create`: Starts a new onboarding pipeline.
  - `POST /onboarding/retry`: Triggers a pipeline retry.
  - `GET /config`: Resolves environment configs (e.g. if mock mode is active).
* **Immediate Returns:** The handlers in [onboardingController.js](file:///e:/PROJECTS/INTEGRTRxGLAU26/gla_hackathon_2026_team_09/server/src/controllers/onboardingController.js) respond with `200 OK` as soon as the service layer validates the request and creates/retrieves the database record, avoiding blocking on downstream integration responses.

---

## 🗄️ 3. Database Layer (PostgreSQL & Supabase)

To support seamless migration from SQLite to Supabase PostgreSQL without refactoring query code in the service/controller layer, a compatibility adapter was built in [db.js](file:///e:/PROJECTS/INTEGRTRxGLAU26/gla_hackathon_2026_team_09/server/src/config/db.js):

* **Connection Pool:** Uses Node Postgres `Pool` to manage active database client sockets.
* **SSL Handling:** Automatically establishes SSL validation when connecting to remote databases (e.g., Supabase or database host strings containing `.supabase` or `co:`):
  ```javascript
  ssl: process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('supabase') || process.env.DATABASE_URL.includes('co:'))
      ? { rejectUnauthorized: false }
      : false
  ```
* **Query Translation Adapter:** SQLite uses standard question marks (`?`) for query parameter replacements, whereas PostgreSQL requires incremental token parameters (`$1`, `$2`, etc.). The database client runs a translation function before dispatching:
  ```javascript
  function translateSql(sql) {
      let index = 1;
      return sql.replace(/\?/g, () => `$${index++}`);
  }
  ```
  This allows queries inside `onboardingService` to remain untouched while running natively on PostgreSQL.

---

## 🛰️ 4. SAP SuccessFactors Integration Adapter

* **API Specification:** Integrates with SuccessFactors EC (Employee Central) OData v2 Services.
* **Adapter Logic:** Located in [successFactorsService.js](file:///e:/PROJECTS/INTEGRTRxGLAU26/gla_hackathon_2026_team_09/server/src/services/successFactorsService.js).
* **Mock Framework:** When `USE_MOCK_SF=true`, the adapter generates high-fidelity identifiers (e.g. `SF-2026-XXXXXX`) and a deep-link path pointing to `https://salesdemo.successfactors.eu/mock/employee/SF-2026-XXXXXX`. When `false`, it executes real XML/JSON OData payload posts to SuccessFactors OData endpoints.

---

## 📢 5. Slack Webhook Integration Adapter

* **API Specification:** Uses Slack Incoming Webhooks to dispatch rich notifications.
* **Formatting:** Automatically prefixes messages with the configured team header (e.g., `[Team 9]`) to ensure clear identification in shared channels.
* **Direct Employee Messages:** Dynamically maps employee notification templates to target team webhooks or direct channels to coordinate communications.

---

## ⚙️ 6. Asynchronous Background Workflow Engine

The core business logic resides in [onboardingService.js](file:///e:/PROJECTS/INTEGRTRxGLAU26/gla_hackathon_2026_team_09/server/src/services/onboardingService.js).

* **Workflow Loop:** 
  Iterates over the integration functions sequentially:
  ```javascript
  const steps = [
      { run: runSuccessFactorsStep, name: 'SuccessFactors' },
      { run: runSlackTeamStep, name: 'Slack Team' },
      { run: runSlackHRStep, name: 'Slack HR' },
      { run: runSlackEmployeeStep, name: 'Slack Employee' }
  ];
  ```
* **Transactional State Recovery:** 
  If step `K` throws an exception, the background loop breaks immediately and saves the error to the database. Upon subsequent `retry` commands:
  - Steps with a state of `success` are skipped entirely.
  - The engine resumes execution starting from the failed step `K`.
* **Demonstration Delay:**
  Incorporates `WORKFLOW_STEP_DELAY_MS` between execution blocks using standard promises to simulate live progress during UI reviews.
