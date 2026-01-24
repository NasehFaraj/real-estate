import { Router } from 'express';
import { getAccessToken, login } from '../controllers/auth.controller.js';
import { refreshAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', login);
router.post('/refresh', refreshAuth, getAccessToken);

export default router;
