import { Router } from 'express';
import { Role } from '../common/Role.js';
import { accessMiddleware } from '../middlewares/access.middleware.js';
import {
    createRequest,
    deleteRequest,
    getRequestById,
    listMyRequests,
    listRequests,
} from '../controllers/requests.controller.js';

const router = Router();

router.post('/', accessMiddleware([Role.ADMIN, Role.MANAGER, Role.BROKER]), createRequest);
router.get('/', accessMiddleware([Role.ADMIN, Role.MANAGER]), listRequests);
router.get('/me', accessMiddleware([Role.BROKER]), listMyRequests);
router.get('/:id', accessMiddleware([Role.ADMIN, Role.MANAGER, Role.BROKER]), getRequestById);
router.delete('/:id', accessMiddleware([Role.ADMIN, Role.MANAGER]), deleteRequest);

export default router;
