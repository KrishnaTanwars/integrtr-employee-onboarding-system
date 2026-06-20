const express = require('express');
const controller = require('../controllers/onboardingController');
const sfService = require('../services/successFactorsService');
const { COMPANY_ID, SF_API_BASE, SF_UI_BASE } = require('../config/sfConfig');
const { getLoginUrl, getProfileUrl } = require('../utils/sfUrls');

const router = express.Router();

router.get('/config', (req, res) => {
    res.json({
        success: true,
        data: {
            company_id: COMPANY_ID,
            api_base_url: SF_API_BASE,
            ui_base_url: SF_UI_BASE,
            login_url: getLoginUrl(),
            upsert_endpoint: `${SF_API_BASE}/odata/v2/upsert`
        }
    });
});

router.get('/onboarding/verify/:userId', async (req, res) => {
    try {
        const user = await sfService.getUser(req.params.userId);
        res.json({
            success: true,
            data: {
                userId: user.userId,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                status: user.status,
                profile_url: getProfileUrl(user.username || user.userId)
            }
        });
    } catch (err) {
        res.status(404).json({ success: false, error: err.message });
    }
});

router.get('/onboarding', controller.listOnboardings);
router.post('/onboarding/create', controller.createOnboarding);
router.post('/onboarding/retry', controller.retryOnboarding);

module.exports = router;
