import { Router } from 'express';
import { Role } from '../common/Role.js';
import { accessMiddleware } from '../middlewares/access.middleware.js';
import {
    getLeastRequestedAreas,
    getMostActiveBrokers,
    getMostRequestedAreas,
    getStats,
} from '../controllers/stats.controller.js';

/**
 * @openapi
 * /api/stats:
 *   get:
 *     tags: [Stats]
 *     summary: Get counts
 *     responses:
 *       200:
 *         description: OK
 *
 * /api/stats/most-requested-areas:
 *   get:
 *     tags: [Stats]
 *     summary: Most requested areas
 *     responses:
 *       200:
 *         description: OK
 *
 * /api/stats/least-requested-areas:
 *   get:
 *     tags: [Stats]
 *     summary: Least requested areas
 *     responses:
 *       200:
 *         description: OK
 *
 * /api/stats/most-active-brokers:
 *   get:
 *     tags: [Stats]
 *     summary: Most active brokers
 *     responses:
 *       200:
 *         description: OK
 */
const router = Router();

router.get('/', accessMiddleware([Role.ADMIN, Role.MANAGER]), getStats);
router.get(
    '/most-requested-areas',
    accessMiddleware([Role.ADMIN, Role.MANAGER]),
    getMostRequestedAreas
);
router.get(
    '/least-requested-areas',
    accessMiddleware([Role.ADMIN, Role.MANAGER]),
    getLeastRequestedAreas
);
router.get(
    '/most-active-brokers',
    accessMiddleware([Role.ADMIN, Role.MANAGER]),
    getMostActiveBrokers
);

export default router;
