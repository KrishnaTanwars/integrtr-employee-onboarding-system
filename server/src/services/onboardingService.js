const { randomUUID } = require('crypto');
const { dbRun, dbGet, dbAll } = require('../config/db');
const sfService = require('./successFactorsService');
const slackService = require('./slackService');

function mapRow(row) {
    if (!row) return null;
    return {
        id: row.id,
        employee_name: row.employee_name,
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        department: row.department,
        idempotency_key: row.idempotency_key,
        created_at: row.created_at,
        sf_employee_id: row.sf_employee_id,
        sf_status: row.sf_status,
        slack_team_status: row.slack_team_status,
        slack_hr_status: row.slack_hr_status,
        slack_employee_status: row.slack_employee_status,
        status: row.status
    };
}

function computeOverallStatus(row) {
    const steps = [row.sf_status, row.slack_team_status, row.slack_hr_status, row.slack_employee_status];
    if (steps.every((s) => s === 'success')) return 'success';
    if (steps.some((s) => s === 'failed')) return 'failed';
    return 'pending';
}

async function updateOverallStatus(id) {
    const row = await dbGet('SELECT * FROM onboarding_requests WHERE id = ?', [id]);
    const status = computeOverallStatus(row);
    await dbRun('UPDATE onboarding_requests SET status = ? WHERE id = ?', [status, id]);
}

async function runSuccessFactorsStep(record) {
    if (record.sf_status === 'success') return;

    const sfId = record.sf_employee_id || sfService.generateUserId();

    try {
        await sfService.createEmployee({
            firstName: record.first_name,
            lastName: record.last_name,
            email: record.email,
            userId: sfId
        });
        await dbRun(
            'UPDATE onboarding_requests SET sf_employee_id = ?, sf_status = ?, sf_error = NULL WHERE id = ?',
            [sfId, 'success', record.id]
        );
    } catch (err) {
        await dbRun(
            'UPDATE onboarding_requests SET sf_status = ?, sf_error = ? WHERE id = ?',
            ['failed', err.message, record.id]
        );
        throw err;
    }
}

async function runSlackTeamStep(record) {
    const row = await dbGet('SELECT * FROM onboarding_requests WHERE id = ?', [record.id]);
    if (row.slack_team_status === 'success') return;
    try {
        await slackService.notifyTeam({
            employeeName: row.employee_name,
            department: row.department,
            email: row.email
        });
        await dbRun('UPDATE onboarding_requests SET slack_team_status = ?, slack_team_error = NULL WHERE id = ?', ['success', row.id]);
    } catch (err) {
        await dbRun('UPDATE onboarding_requests SET slack_team_status = ?, slack_team_error = ? WHERE id = ?', ['failed', err.message, row.id]);
        throw err;
    }
}

async function runSlackHRStep(record) {
    const row = await dbGet('SELECT * FROM onboarding_requests WHERE id = ?', [record.id]);
    if (row.slack_hr_status === 'success') return;
    try {
        await slackService.notifyHR({
            employeeName: row.employee_name,
            department: row.department,
            email: row.email,
            sfEmployeeId: row.sf_employee_id
        });
        await dbRun('UPDATE onboarding_requests SET slack_hr_status = ?, slack_hr_error = NULL WHERE id = ?', ['success', row.id]);
    } catch (err) {
        await dbRun('UPDATE onboarding_requests SET slack_hr_status = ?, slack_hr_error = ? WHERE id = ?', ['failed', err.message, row.id]);
        throw err;
    }
}

async function runSlackEmployeeStep(record) {
    const row = await dbGet('SELECT * FROM onboarding_requests WHERE id = ?', [record.id]);
    if (row.slack_employee_status === 'success') return;
    try {
        await slackService.notifyEmployee({
            employeeName: row.employee_name,
            department: row.department
        });
        await dbRun('UPDATE onboarding_requests SET slack_employee_status = ?, slack_employee_error = NULL WHERE id = ?', ['success', row.id]);
    } catch (err) {
        await dbRun('UPDATE onboarding_requests SET slack_employee_status = ?, slack_employee_error = ? WHERE id = ?', ['failed', err.message, row.id]);
        throw err;
    }
}

async function executeWorkflow(record) {
    for (const step of [runSuccessFactorsStep, runSlackTeamStep, runSlackHRStep, runSlackEmployeeStep]) {
        try {
            await step(record);
        } catch {
            break;
        }
    }
    await updateOverallStatus(record.id);
    return dbGet('SELECT * FROM onboarding_requests WHERE id = ?', [record.id]);
}

async function listOnboardings() {
    const rows = await dbAll('SELECT * FROM onboarding_requests ORDER BY created_at DESC');
    return rows.map(mapRow);
}

async function createOnboarding(data) {
    const { first_name, last_name, email, department, idempotency_key } = data;

    if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !department || !idempotency_key) {
        throw new Error('first_name, last_name, email, department, and idempotency_key are required');
    }

    const existing = await dbGet('SELECT * FROM onboarding_requests WHERE idempotency_key = ?', [idempotency_key]);
    if (existing) {
        const updated = await executeWorkflow(existing);
        return { record: mapRow(updated), isDuplicate: true };
    }

    const id = randomUUID();
    const employee_name = `${first_name.trim()} ${last_name.trim()}`;

    await dbRun(
        `INSERT INTO onboarding_requests
        (id, employee_name, first_name, last_name, email, department, idempotency_key, initiated_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, employee_name, first_name.trim(), last_name.trim(), email.trim(), department, idempotency_key, 'web-ui', new Date().toISOString()]
    );

    const record = await dbGet('SELECT * FROM onboarding_requests WHERE id = ?', [id]);
    const updated = await executeWorkflow(record);
    return { record: mapRow(updated), isDuplicate: false };
}

async function retryOnboarding(id) {
    const record = await dbGet('SELECT * FROM onboarding_requests WHERE id = ?', [id]);
    if (!record) throw new Error('Onboarding request not found');
    const updated = await executeWorkflow(record);
    return mapRow(updated);
}

function getFailedStepInfo(record) {
    if (record.sf_status === 'failed') {
        return { step: 'SuccessFactors User Upsert', advice: 'Check SF credentials and unique userId.', error: record.sf_error };
    }
    if (record.slack_team_status === 'failed') {
        return { step: 'Slack Team Notification', advice: 'Verify SLACK_TEAM_WEBHOOK_URL.', error: record.slack_team_error };
    }
    if (record.slack_hr_status === 'failed') {
        return { step: 'Slack HR Notification', advice: 'Verify SLACK_HR_WEBHOOK_URL.', error: record.slack_hr_error };
    }
    if (record.slack_employee_status === 'failed') {
        return { step: 'Slack Employee Notification', advice: 'Verify employee Slack webhook.', error: record.slack_employee_error };
    }
    return null;
}

module.exports = { listOnboardings, createOnboarding, retryOnboarding, getFailedStepInfo, mapRow };
