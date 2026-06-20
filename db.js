const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../onboarding.db');
const db = new sqlite3.Database(dbPath);

function createTable() {
    return new Promise((resolve, reject) => {
        db.run(`CREATE TABLE IF NOT EXISTS onboarding_requests (
            id TEXT PRIMARY KEY,
            employee_name TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT NOT NULL,
            department TEXT NOT NULL,
            idempotency_key TEXT UNIQUE,
            initiated_by TEXT,
            created_at TEXT NOT NULL,
            sf_employee_id TEXT,
            sf_status TEXT DEFAULT 'pending',
            sf_error TEXT,
            slack_team_status TEXT DEFAULT 'pending',
            slack_team_error TEXT,
            slack_hr_status TEXT DEFAULT 'pending',
            slack_hr_error TEXT,
            slack_employee_status TEXT DEFAULT 'pending',
            slack_employee_error TEXT,
            status TEXT DEFAULT 'pending'
        )`, (err) => (err ? reject(err) : resolve()));
    });
}

