import { Router } from 'express';
import { Role } from '../common/Role.js';
import { accessMiddleware } from '../middlewares/access.middleware.js';
import {
    getMostActiveBrokers,
    getMostRequestedAreas,
    getStats,
} from '../controllers/stats.controller.js';

const router = Router();

router.get('/', accessMiddleware([Role.ADMIN, Role.MANAGER]), getStats);
router.get(
    '/most-requested-areas',
    accessMiddleware([Role.ADMIN, Role.MANAGER]),
    getMostRequestedAreas
);
router.get(
    '/most-active-brokers',
    accessMiddleware([Role.ADMIN, Role.MANAGER]),
    getMostActiveBrokers
);

export default router;
