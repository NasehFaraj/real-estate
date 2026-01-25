import { Router } from 'express';
import { getAccessToken, login } from '../controllers/auth.controller.js';
import { refreshAuth } from '../middlewares/auth.middleware.js';

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     security: []
 *     responses:
 *       200:
 *         description: Success
 *       403:
 *         description: Forbidden
 */
const router = Router();

router.post('/login', login);
router.post('/refresh', refreshAuth, getAccessToken);

export default router;
