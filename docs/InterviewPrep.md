# Interview Preparation Guide

This guide compiles pitch descriptions, technical details, and common questions to prepare developers for technical interviews regarding the **INTEGRTR Onboarding Platform**.

---

## ⚡ 60-Second Elevator Pitch

> *"During the INTEGRTR hackathon, my team and I built a **resilient cross-system employee onboarding orchestrator** that bridges SAP SuccessFactors, custom PostgreSQL state tracking, and Slack notifications. The primary differentiator of our platform is its **reliability engineering focus**. In typical integrations, if one downstream system fails partway, you end up with duplicate profiles or missing channels. We solved this by developing a database-driven workflow ledger that ensures **absolute idempotency** (no double creation), handles long-running integration calls **asynchronously in the background** to optimize API latency, and implements **step-level recovery** so operators can resume failed flows exactly from the step that broke without repeating successful ones."*

---

## ⏱️ 2-Minute Project Walkthrough

1. **The Core Problem:**
   Onboarding an employee involves talking to SuccessFactors (Core HR), database ledgers, and team/HR Slack channels. When step 3 fails, steps 1 and 2 have already run, leaving orphan data. Double-clicks on submit can create duplicate SuccessFactors profiles.
2. **Our Architecture:**
   We built a React frontend on Vite and Tailwind CSS v4, an Express.js backend API gateway, and a database layer powered by Supabase PostgreSQL. 
3. **The Workflow Engine:**
   When an operator submits a new hire, the backend immediately inserts an entry into a PostgreSQL ledger with all step statuses set to `pending` and returns a `200 OK` response to the client within milliseconds. This keeps the client responsive. 
4. **Asynchronous Processing:**
   A background executor runs the steps sequentially. We also built a custom SQL translator to map standard SQLite `?` operators to Postgres `$1, $2` parameters automatically, migrating from SQLite to Supabase PostgreSQL without refactoring the service logic.
5. **Handling Failures and Recoveries:**
   If a Slack webhook fails, the timeline shows exactly where it failed. The operator updates the webhook URL, clicks "Retry", and the system resumes execution starting at the Slack step, skipping the already-created SuccessFactors record.

---

## 🔬 Technical Deep Dive

### 1. Zero-Refactoring Database Migration
* **Challenge:** Node.js SQLite drivers are synchronous and use `?` syntax. PostgreSQL is asynchronous and uses `$1, $2` syntax. We had to swap databases without touching query strings in the service layer.
* **Solution:** We wrapped Postgres `Pool` queries inside asynchronous `dbRun`, `dbGet`, and `dbAll` helpers. We wrote a regex parser `translateSql` that replaces each instance of `?` with an incremental counter: `sql.replace(/\?/g, () => '$' + index++)`. We then restored the `await` keywords across the services.

### 2. Idempotency Execution
* **Challenge:** Prevent double-clicking or resubmitting the same hire from creating duplicate SuccessFactors profiles.
* **Solution:** The frontend generates an `idempotency_key` (derived from `email` and a unique UUID). The database table enforces a `UNIQUE` constraint on this column. If a duplicate submission occurs, the backend performs a query, locates the existing record, returns it immediately to the client, and (if it failed previously) restarts the background loop safely.

### 3. Step Skipping on Retry
* **Challenge:** When retrying a failed pipeline, how do we prevent calling SuccessFactors again if it already succeeded?
* **Solution:** The steps array is defined as objects with runner functions. The runner functions check the database row:
  ```javascript
  if (record.sf_status === 'success') return; // Skip
  ```
  Since the state is updated in PostgreSQL immediately after each step completes, the retry process naturally skips completed steps and resumes execution from the first `failed` or `pending` step.

---

## 💬 Common Interview Questions & Answers

### Q1: What happens if the server crashes mid-workflow?
* **Answer:** Since the state of each completed step is committed to PostgreSQL in real-time before moving to the next integration, the database remains in an accurate state. If the server crashes, the overall request status remains `pending` or is flagged accordingly. The operator can click **Retry** on the dashboard, which retrieves the persisted statuses, skips the completed tasks, and starts execution from the first incomplete step.

### Q2: Why did you choose asynchronous background execution over synchronous API orchestration?
* **Answer:** External APIs like SuccessFactors or Slack webhooks are slow, network-dependent, and prone to temporary rate limits or timeouts. Running these synchronously inside the HTTP request thread blocks the client and risks hitting server gateway timeout limits (e.g. Heroku/Render 30-second thresholds). Background execution reduces response times from several seconds to under 35 milliseconds.

### Q3: How does CORS work in your setup, and how do you secure it for production?
* **Answer:** In development, we use `cors()` to allow cross-origin requests from `localhost:5173`. For production, we pass an origin whitelist object configuration to `cors()` to restrict requests to our Vercel frontend domain, preventing arbitrary clients from calling the backend.
