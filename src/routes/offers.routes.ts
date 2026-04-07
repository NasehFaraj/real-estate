import { Router } from 'express';
import { Role } from '../common/Role.js';
import { accessMiddleware } from '../middlewares/access.middleware.js';
import {
    createOffer,
    deleteOffer,
    getOfferById,
    listMyOffers,
    listOffers,
    updateOffer,
} from '../controllers/offers.controller.js';

/**
 * @openapi
 * /api/offers:
 *   post:
 *     tags: [Offers]
 *     summary: Create offer
 *     responses:
 *       201:
 *         description: Created
 *   get:
 *     tags: [Offers]
 *     summary: List offers (admin/manager)
 *     description: Filtering supports field=value, field_like=value, field_min/field_max, createdAt_min/createdAt_max, offerStatus=true|false
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
 * /api/offers/me:
 *   get:
 *     tags: [Offers]
 *     summary: List my offers (broker)
 *     responses:
 *       200:
 *         description: OK
 *
 * /api/offers/{id}:
 *   get:
 *     tags: [Offers]
 *     summary: Get offer by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     tags: [Offers]
 *     summary: Delete offer
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 *   patch:
 *     tags: [Offers]
 *     summary: Update offer
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 */
const router = Router();

router.post('/', accessMiddleware([Role.ADMIN, Role.MANAGER, Role.BROKER]), createOffer);
router.get('/', accessMiddleware([Role.ADMIN, Role.MANAGER]), listOffers);
router.get('/me', accessMiddleware([Role.BROKER]), listMyOffers);
router.get('/:id', accessMiddleware([Role.ADMIN, Role.MANAGER, Role.BROKER]), getOfferById);
router.patch('/:id', accessMiddleware([Role.ADMIN, Role.MANAGER, Role.BROKER]), updateOffer);
router.delete('/:id', accessMiddleware([Role.ADMIN, Role.MANAGER]), deleteOffer);

export default router;
