import { Router } from 'express';
import { getAccessToken, getCurrentUser, login, logout } from '../controllers/auth.controller.js';
import { Role } from '../common/Role.js';
import { accessMiddleware } from '../middlewares/access.middleware.js';
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
 */
/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     security: []
 *     responses:
 *       200:
 *         description: Success
 *
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user
 *     responses:
 *       200:
 *         description: Success
 *
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout and clear auth cookies
 *     responses:
 *       200:
 *         description: Success
 */
const router = Router();

router.post('/login', login);
router.post('/refresh', refreshAuth, getAccessToken);
router.get('/me', accessMiddleware([Role.ADMIN, Role.MANAGER, Role.BROKER]), getCurrentUser);
router.post('/logout', logout);

export default router;
