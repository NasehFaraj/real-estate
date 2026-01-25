import { Router } from 'express';
import { Role } from '../common/Role.js';
import { accessMiddleware } from '../middlewares/access.middleware.js';
import { createUser, deleteUser, listUsers } from '../controllers/users.controller.js';

const router = Router();

router.post('/', accessMiddleware([Role.ADMIN]), createUser);
router.get('/', accessMiddleware([Role.ADMIN, Role.MANAGER]), listUsers);
router.delete('/:id', accessMiddleware([Role.ADMIN]), deleteUser);

export default router;
