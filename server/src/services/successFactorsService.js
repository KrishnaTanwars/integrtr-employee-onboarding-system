require('dotenv').config();
const { COMPANY_ID, SF_API_BASE, SF_USER_ID, SF_PASSWORD } = require('../config/sfConfig');

function getAuthHeader() {
    const authString = `${SF_USER_ID}@${COMPANY_ID}`;
    return `Basic ${Buffer.from(`${authString}:${SF_PASSWORD}`).toString('base64')}`;
}

function generateUserId() {
    return `t9_${Date.now()}`;
}

async function createEmployee({ firstName, lastName, email, userId }) {
    const sfId = userId || generateUserId();

    const payload = {
        __metadata: { uri: `User('${sfId}')`, type: 'SFOData.User' },
        userId: sfId,
        assignmentIdExternal: sfId,
        username: sfId,
        status: 't',
        firstName: firstName?.trim() || 'Employee',
        lastName: lastName?.trim() || 'New',
        email: email?.trim()
    };

    const response = await fetch(`${SF_API_BASE}/odata/v2/upsert`, {
        method: 'POST',
        headers: {
            Authorization: getAuthHeader(),
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data?.error?.message?.value || `SF API returned status ${response.status}`);
    }

    const result = data?.d?.[0];
    if (result?.status === 'FAILED') {
        throw new Error(result.message || 'SuccessFactors User upsert failed');
    }

    const verified = await getUser(sfId).catch(() => null);

    return {
        sfId,
        username: verified?.username || sfId,
        firstName: verified?.firstName || payload.firstName,
        lastName: verified?.lastName || payload.lastName,
        email: verified?.email || payload.email,
        hasPeopleProfile: Boolean(verified?.personIdExternal || verified?.personGuid)
    };
}

async function getUser(userId) {
    const response = await fetch(
        `${SF_API_BASE}/odata/v2/User('${encodeURIComponent(userId)}')?$format=json`,
        {
            headers: {
                Authorization: getAuthHeader(),
                Accept: 'application/json'
            }
        }
    );

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.error?.message?.value || `User lookup failed (${response.status})`);
    }

    return data?.d || null;
}

module.exports = { createEmployee, getUser, generateUserId };
