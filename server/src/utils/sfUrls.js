const { COMPANY_ID, SF_UI_BASE } = require('../config/sfConfig');

function getLoginUrl() {
    return `${SF_UI_BASE}/login?company=${COMPANY_ID}`;
}

function getProfileUrl(username) {
    if (!username) return getLoginUrl();
    return `${SF_UI_BASE}/sf/liveprofile?company=${COMPANY_ID}&username=${encodeURIComponent(username)}`;
}

module.exports = {
    getLoginUrl,
    getProfileUrl,
    getPeopleProfileUrl: getProfileUrl,
    SF_UI_BASE,
    COMPANY_ID
};
