const onboardingService = require('../services/onboardingService');
const { dbGet } = require('../config/db');
const { getProfileUrl } = require('../utils/sfUrls');

function enrich(record) {
    if (!record?.sf_employee_id) return record;
    return { ...record, profile_url: getProfileUrl(record.sf_employee_id) };
}

function failurePayload(record, failureInfo) {
    return {
        id: record.id,
        sf_status: record.sf_status,
        slack_team_status: record.slack_team_status,
        slack_hr_status: record.slack_hr_status,
        slack_employee_status: record.slack_employee_status,
        failed_step: failureInfo?.step,
        advice: failureInfo?.advice,
        error_details: failureInfo?.error
    };
}

async function listOnboardings(req, res) {
    try {
        res.json({ success: true, data: await onboardingService.listOnboardings() });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}

async function createOnboarding(req, res) {
    try {
        const { record } = await onboardingService.createOnboarding(req.body);
        const allSuccess = ['sf_status', 'slack_team_status', 'slack_hr_status', 'slack_employee_status']
            .every((k) => record[k] === 'success');

        if (allSuccess) {
            return res.json({ success: true, data: enrich(record) });
        }

        const dbRow = await dbGet('SELECT * FROM onboarding_requests WHERE id = ?', [record.id]);
        const failureInfo = onboardingService.getFailedStepInfo(dbRow);
        res.status(422).json({
            success: false,
            error: failureInfo?.step || 'Workflow incomplete',
            data: failurePayload(record, failureInfo)
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}

async function retryOnboarding(req, res) {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ success: false, error: 'id is required' });

        const record = await onboardingService.retryOnboarding(id);
        const allSuccess = ['sf_status', 'slack_team_status', 'slack_hr_status', 'slack_employee_status']
            .every((k) => record[k] === 'success');

        if (allSuccess) {
            return res.json({ success: true, data: enrich(record) });
        }

        const dbRow = await dbGet('SELECT * FROM onboarding_requests WHERE id = ?', [id]);
        const failureInfo = onboardingService.getFailedStepInfo(dbRow);
        res.status(422).json({
            success: false,
            error: failureInfo?.step || 'Retry incomplete',
            data: failurePayload(record, failureInfo)
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}

module.exports = { listOnboardings, createOnboarding, retryOnboarding };
