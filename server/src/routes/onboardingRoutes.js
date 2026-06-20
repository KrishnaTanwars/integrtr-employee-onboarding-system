import express from 'express';
import { listOnboardings, createOnboarding, retryOnboarding } from '../controllers/onboardingController.js';
import { getUser } from '../services/successFactorsService.js';
import { COMPANY_ID, SF_API_BASE, SF_UI_BASE, USE_MOCK_SF } from '../config/sfConfig.js';
import { getLoginUrl, getProfileUrl } from '../utils/sfUrls.js';

const router = express.Router();

router.get('/config', (req, res) => {
    res.json({
        success: true,
        data: {
            company_id: COMPANY_ID,
            api_base_url: SF_API_BASE,
            ui_base_url: SF_UI_BASE,
            use_mock_sf: USE_MOCK_SF,
            login_url: getLoginUrl(),
            upsert_endpoint: `${SF_API_BASE}/odata/v2/upsert`
        }
    });
});

router.get('/onboarding/verify/:userId', async (req, res) => {
    try {
        const user = await getUser(req.params.userId);
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

router.get('/onboarding', listOnboardings);
router.post('/onboarding/create', createOnboarding);
router.post('/onboarding/retry', retryOnboarding);

export default router;
