import { Router } from 'express';
import { getDbState } from '../config/db.js';

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Health check
 *     security: []
 *     responses:
 *       200:
 *         description: OK
 */
const router = Router();

router.get('/', (_req, res) => {
    return res.json({ ok: true, db: getDbState() });
});

export default router;
