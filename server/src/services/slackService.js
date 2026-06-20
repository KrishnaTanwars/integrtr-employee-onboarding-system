require('dotenv').config();

const TEAM_PREFIX = process.env.TEAM_NAME || '[Team 9]';
const TEAM_WEBHOOK = process.env.SLACK_TEAM_WEBHOOK_URL;
const HR_WEBHOOK = process.env.SLACK_HR_WEBHOOK_URL;
const EMPLOYEE_WEBHOOK = process.env.SLACK_EMPLOYEE_WEBHOOK_URL || TEAM_WEBHOOK;
const { getProfileUrl } = require('../utils/sfUrls');

async function postToSlack(webhookUrl, text) {
    if (!webhookUrl) throw new Error('Slack webhook URL is not configured');

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Slack returned status ${response.status}`);
    }
}

async function notifyTeam({ employeeName, department, email }) {
    await postToSlack(TEAM_WEBHOOK,
        `${TEAM_PREFIX} 👋 Welcome *${employeeName}* to the team!\n` +
        `• Department: ${department}\n• Email: ${email}`);
}

async function notifyHR({ employeeName, department, email, sfEmployeeId }) {
    const profileUrl = getProfileUrl(sfEmployeeId);
    await postToSlack(HR_WEBHOOK,
        `${TEAM_PREFIX} 📋 *New hire for HR review*\n` +
        `• Name: ${employeeName}\n• Department: ${department}\n` +
        `• Email: ${email}\n• <${profileUrl}|View SuccessFactors Profile>`);
}

async function notifyEmployee({ employeeName, department }) {
    await postToSlack(EMPLOYEE_WEBHOOK,
        `${TEAM_PREFIX} 🎉 Hi *${employeeName}*, welcome aboard!\n` +
        `Your onboarding in *${department}* has been initiated. HR will reach out shortly.`);
}

module.exports = { notifyTeam, notifyHR, notifyEmployee };
