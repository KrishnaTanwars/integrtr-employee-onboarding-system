# Production Deployment Verification Checklist

Use this checklist to verify that all systems are correctly configured before final deployment.

---

## 🗄️ 1. Database (Supabase PostgreSQL)
* [ ] **Database Connection Pool:**
  - Verify that the connection URL uses `postgresql://` and includes host/pool parameters.
* [ ] **SSL Configuration:**
  - Ensure SSL options inside `db.js` evaluate to `true` when host matches `.supabase` or connection string requires it.
* [ ] **Auto-Migration Check:**
  - Upon starting the backend server, verify the tables are created. Check using Supabase SQL Editor:
    ```sql
    SELECT * FROM onboarding_requests LIMIT 1;
    ```
* [ ] **Constraints & Indexes:**
  - Confirm that `idempotency_key` is protected by a `UNIQUE` constraint.

---

## 🖥️ 2. Backend Web Service (Render)
* [ ] **Environment Configuration:**
  Ensure the following variables are configured under Render environment variables:
  - `DATABASE_URL` (direct Supabase PostgreSQL string)
  - `PORT=5000`
  - `USE_MOCK_SF` (set `true` or `false` based on credential availability)
  - `USE_MOCK_SLACK` (set `true` or `false`)
  - `WORKFLOW_STEP_DELAY_MS=0` (disabled in production)
* [ ] **Startup Settings:**
  - **Language:** Node
  - **Root Directory:** `server`
  - **Build Command:** `npm install`
  - **Start Command:** `npm start`
* [ ] **Health Check Route:**
  - Set Render Health Check Path to `/` (returns status `200` with text "Backend Running").
* [ ] **CORS Settings:**
  - Ensure CORS middleware is enabled to allow Vercel frontends to connect.

---

## 🌐 3. Frontend Web Service (Vercel)
* [ ] **Build Pipeline Settings:**
  - **Framework Preset:** Vite
  - **Root Directory:** `client`
  - **Build Command:** `npm run build`
  - **Output Directory:** `dist`
* [ ] **Environment Configuration:**
  Configure the backend endpoint URL:
  - `VITE_API_BASE_URL=https://<your-render-app-url>/api`
* [ ] **SSL (HTTPS):**
  - Verify Vercel provides a valid SSL certificate (HTTPS) for the custom domain.
* [ ] **Network / Fetch Checks:**
  - After deployment, load the Vercel site, inspect the network console, and verify that `GET /api/onboarding` and `GET /api/config` resolve with status `200`.
