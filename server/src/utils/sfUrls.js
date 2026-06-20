import { COMPANY_ID, SF_UI_BASE, USE_MOCK_SF } from '../config/sfConfig.js';

export function getLoginUrl() {
    return `${SF_UI_BASE}/login?company=${COMPANY_ID}`;
}

export function getProfileUrl(username) {
    if (!username) return getLoginUrl();
    if (USE_MOCK_SF) {
        return `${SF_UI_BASE}/mock/employee/${encodeURIComponent(username)}`;
    }
    return `${SF_UI_BASE}/sf/liveprofile?company=${COMPANY_ID}&username=${encodeURIComponent(username)}`;
}

export const getPeopleProfileUrl = getProfileUrl;
export { SF_UI_BASE, COMPANY_ID };
