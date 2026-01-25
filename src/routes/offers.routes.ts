import { Router } from 'express';
import { Role } from '../common/Role.js';
import { accessMiddleware } from '../middlewares/access.middleware.js';
import {
    createOffer,
    deleteOffer,
    getOfferById,
    listMyOffers,
    listOffers,
} from '../controllers/offers.controller.js';

const router = Router();

router.post('/', accessMiddleware([Role.ADMIN, Role.MANAGER, Role.BROKER]), createOffer);
router.get('/', accessMiddleware([Role.ADMIN, Role.MANAGER]), listOffers);
router.get('/me', accessMiddleware([Role.BROKER]), listMyOffers);
router.get('/:id', accessMiddleware([Role.ADMIN, Role.MANAGER, Role.BROKER]), getOfferById);
router.delete('/:id', accessMiddleware([Role.ADMIN, Role.MANAGER]), deleteOffer);

export default router;
