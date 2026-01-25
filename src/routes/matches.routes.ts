import { Router } from 'express';
import { Role } from '../common/Role.js';
import { accessMiddleware } from '../middlewares/access.middleware.js';
import {
    getMatchById,
    listMatches,
    listMyMatches,
} from '../controllers/matches.controller.js';

const router = Router();

router.get('/', accessMiddleware([Role.ADMIN, Role.MANAGER]), listMatches);
router.get('/me', accessMiddleware([Role.BROKER]), listMyMatches);
router.get('/:id', accessMiddleware([Role.ADMIN, Role.MANAGER, Role.BROKER]), getMatchById);

export default router;
