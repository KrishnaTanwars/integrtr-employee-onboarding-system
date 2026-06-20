import * as onboardingService from '../services/onboardingService.js';
import { dbGet } from '../config/db.js';
import { getProfileUrl } from '../utils/sfUrls.js';

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

export async function listOnboardings(req, res) {
    try {
        res.json({ success: true, data: await onboardingService.listOnboardings() });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}

export async function createOnboarding(req, res) {
    try {
        const { record } = await onboardingService.createOnboarding(req.body);
        res.json({ success: true, data: enrich(record) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}

export async function retryOnboarding(req, res) {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ success: false, error: 'id is required' });

        const record = await onboardingService.retryOnboarding(id);
        res.json({ success: true, data: enrich(record) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}
