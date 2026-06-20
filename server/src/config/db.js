import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('supabase') || process.env.DATABASE_URL.includes('co:'))
        ? { rejectUnauthorized: false }
        : false
});

export async function initDb() {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS onboarding_requests (
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
        )`);
        console.log('✅ PostgreSQL / Supabase initialized successfully');
    } catch (err) {
        console.error('❌ PostgreSQL Initialization Failed:', err.message);
        throw err;
    }
}

function translateSql(sql) {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
}

export async function dbRun(sql, params = []) {
    const pgSql = translateSql(sql);
    return await pool.query(pgSql, params);
}

export async function dbGet(sql, params = []) {
    const pgSql = translateSql(sql);
    const result = await pool.query(pgSql, params);
    return result.rows[0] || null;
}

export async function dbAll(sql, params = []) {
    const pgSql = translateSql(sql);
    const result = await pool.query(pgSql, params);
    return result.rows;
}
