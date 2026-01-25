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

/**
 * @openapi
 * /api/requests:
 *   post:
 *     tags: [Requests]
 *     summary: Create request
 *     responses:
 *       201:
 *         description: Created
 *   get:
 *     tags: [Requests]
 *     summary: List requests (admin/manager)
 *     description: Filtering supports field=value, field_like=value, field_min/field_max, createdAt_min/createdAt_max
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string }
 *       - in: query
 *         name: sortDir
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: OK
 *
 * /api/requests/me:
 *   get:
 *     tags: [Requests]
 *     summary: List my requests (broker)
 *     responses:
 *       200:
 *         description: OK
 *
 * /api/requests/{id}:
 *   get:
 *     tags: [Requests]
 *     summary: Get request by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     tags: [Requests]
 *     summary: Delete request
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

router.post('/', accessMiddleware([Role.ADMIN, Role.MANAGER, Role.BROKER]), createRequest);
router.get('/', accessMiddleware([Role.ADMIN, Role.MANAGER]), listRequests);
router.get('/me', accessMiddleware([Role.BROKER]), listMyRequests);
router.get('/:id', accessMiddleware([Role.ADMIN, Role.MANAGER, Role.BROKER]), getRequestById);
router.delete('/:id', accessMiddleware([Role.ADMIN, Role.MANAGER]), deleteRequest);

export default router;
