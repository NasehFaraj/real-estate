import { Router } from 'express';
import { Role } from '../common/Role.js';
import { accessMiddleware } from '../middlewares/access.middleware.js';
import { createUser, deleteUser, listUsers } from '../controllers/users.controller.js';

/**
 * @openapi
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Create manager or broker
 *     responses:
 *       201:
 *         description: Created
 *   get:
 *     tags: [Users]
 *     summary: List users
 *     responses:
 *       200:
 *         description: OK
 *
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 */
const router = Router();

router.post('/', accessMiddleware([Role.ADMIN]), createUser);
router.get('/', accessMiddleware([Role.ADMIN, Role.MANAGER]), listUsers);
router.delete('/:id', accessMiddleware([Role.ADMIN]), deleteUser);

export default router;
