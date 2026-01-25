import { Router } from 'express';
import { Role } from '../common/Role.js';
import { accessMiddleware } from '../middlewares/access.middleware.js';
import { getMatchById, listMatches, listMyMatches } from '../controllers/matches.controller.js';

/**
 * @openapi
 * /api/matches:
 *   get:
 *     tags: [Matches]
 *     summary: List matches (admin/manager)
 *     responses:
 *       200:
 *         description: OK
 *
 * /api/matches/me:
 *   get:
 *     tags: [Matches]
 *     summary: List my matches (broker)
 *     responses:
 *       200:
 *         description: OK
 *
 * /api/matches/{id}:
 *   get:
 *     tags: [Matches]
 *     summary: Get match by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 */
const router = Router();

router.get('/', accessMiddleware([Role.ADMIN, Role.MANAGER]), listMatches);
router.get('/me', accessMiddleware([Role.BROKER]), listMyMatches);
router.get('/:id', accessMiddleware([Role.ADMIN, Role.MANAGER, Role.BROKER]), getMatchById);

export default router;
