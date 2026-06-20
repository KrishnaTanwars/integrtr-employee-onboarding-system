import { COMPANY_ID, SF_API_BASE, SF_USER_ID, SF_PASSWORD, USE_MOCK_SF } from '../config/sfConfig.js';

function getAuthHeader() {
    const authString = `${SF_USER_ID}@${COMPANY_ID}`;
    return `Basic ${Buffer.from(`${authString}:${SF_PASSWORD}`).toString('base64')}`;
}

export function generateUserId() {
    if (USE_MOCK_SF) {
        return `SF-2026-${String(Math.floor(100000 + Math.random() * 900000))}`;
    }
    return `t9_${Date.now()}`;
}

export async function createEmployee({ firstName, lastName, email, userId }) {
    if (USE_MOCK_SF) {
        const sfId = userId || generateUserId();
        return {
            sfId,
            username: sfId,
            firstName: firstName?.trim() || 'Employee',
            lastName: lastName?.trim() || 'New',
            email: email?.trim(),
            hasPeopleProfile: true
        };
    }
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

    const text = await response.text();
    let data;
    try {
        data = text ? JSON.parse(text) : null;
    } catch (e) {
        throw new Error(`SuccessFactors API returned a non-JSON response (Status ${response.status}): ${text.substring(0, 200)}`);
    }

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

export async function getUser(userId) {
    if (USE_MOCK_SF) {
        return {
            username: userId,
            firstName: 'Mock',
            lastName: 'User',
            email: 'mock@example.com',
            personIdExternal: userId,
            personGuid: 'mock-guid'
        };
    }
    const response = await fetch(
        `${SF_API_BASE}/odata/v2/User('${encodeURIComponent(userId)}')?$format=json`,
        {
            headers: {
                Authorization: getAuthHeader(),
                Accept: 'application/json'
            }
        }
    );

    const text = await response.text();
    let data;
    try {
        data = text ? JSON.parse(text) : null;
    } catch (e) {
        throw new Error(`SuccessFactors API returned a non-JSON response (Status ${response.status}): ${text.substring(0, 200)}`);
    }
    
    if (!response.ok) {
        throw new Error(data?.error?.message?.value || `User lookup failed (${response.status})`);
    }

    return data?.d || null;
}
