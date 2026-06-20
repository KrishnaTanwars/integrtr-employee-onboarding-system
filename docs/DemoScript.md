# Live Demo Script & Walkthrough

This script provides step-by-step instructions to demonstrate the **INTEGRTR Workflow Hub**'s capabilities during code reviews, video pitches, or live presentations.

---

## 🎭 Preparation
1. Ensure the backend server is running: `npm start` inside `server/`.
2. Ensure the frontend client is running: `npm run dev` inside `client/`.
3. Open `http://localhost:5173/` in your browser.
4. Ensure `USE_MOCK_SF=true` and `USE_MOCK_SLACK=true` in `server/.env`.

---

## 🟢 Part 1: The Happy Path (Asynchronous Automation)

### Steps:
1. **Show the Dashboard:** Point out the top header ("INTEGRTR Workflow Hub") showing the database connection and the active status badges. Note the KPI cards showing the baseline statistics.
2. **Submit a New Hire:** In the form on the left, fill in:
   - First Name: `Kobe`
   - Last Name: `Bryant`
   - Employee Email: `kobe@lakers.com`
   - Department: `Basketball Operations`
3. **Click Submit:** Press **Start Onboarding Flow**.
4. **Observe Immediate Return:** Point out that the form resets instantly, and a new row for `Kobe Bryant` appears in the table with an overall status of **Pending**. Note that the UI did not freeze.
5. **Watch Live Transitions:** Because `WORKFLOW_STEP_DELAY_MS=1000` is active, watch the progress bar update:
   - SuccessFactors status is active (spinning loader) $\rightarrow$ updates to **Success** ✅.
   - Slack Team status becomes active $\rightarrow$ updates to **Success** ✅.
   - Slack HR status becomes active $\rightarrow$ updates to **Success** ✅.
   - Overall status updates to **Success** ✅.
6. **Timeline Inspection:** Click the `Kobe Bryant` row to expand the workflow timeline. Point out the verified SAP SuccessFactors ID and the deep link. Click the link to show it redirects correctly.

---

## 🔴 Part 2: The Failure Path (Integration Failure Injection)

### Steps:
1. **Simulate a Webhook Outage:** 
   - Open `server/.env` and update `USE_MOCK_SLACK=false` (this simulates calling real but non-existent URLs).
   - Restart the server: `npm start`.
2. **Onboard another Employee:** Fill out the form:
   - First Name: `Stephen`
   - Last Name: `Curry`
   - Employee Email: `stephen@warriors.com`
   - Department: `Engineering`
3. **Click Submit:** Watch the row appear in the table.
4. **Observe Failure:**
   - SAP SuccessFactors completes successfully ✅.
   - Slack Team Notification runs and **Fails** ❌ (network connection error).
   - The overall pipeline halts and status transitions to **Failed** ❌.
5. **Inspect the Error:** Click the row to expand the timeline. Show the red error panel indicating the network error, and note the custom advice ("Ensure SLACK_TEAM_WEBHOOK_URL environment variable is set").

---

## 🔵 Part 3: Retry & Recovery (Idempotency and skip checks)

### Steps:
1. **Fix the Webhook Outage:**
   - In `server/.env`, set `USE_MOCK_SLACK=true` again.
   - Restart the server.
2. **Initiate Retry:** Click the **Retry Flow** button on the `Stephen Curry` row.
3. **Watch skip & resume behavior:**
   - Expand the timeline immediately.
   - Note that SAP SuccessFactors is **already marked as Success** and is skipped (no duplicate employee creation).
   - The workflow resumes starting from the Slack Team Step, which now completes successfully ✅.
   - Subsequent steps run and complete.
   - The progress bar updates to `100%` and overall status shifts to **Success** ✅.

---

## 📊 Part 4: Filters & Search Monitoring

### Steps:
1. **Search Query:** Type `Kobe` in the search box. Point out the instant client-side filtering.
2. **Department Filter:** Select `Engineering` from the dropdown list. Point out that the list automatically filters, showing only relevant entries.
3. **KPI Sync:** Point out that the KPI cards at the top (Total Requests, Completed, Failed) remain in sync with the current database counts.
