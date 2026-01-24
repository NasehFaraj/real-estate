import { Router } from 'express';
import { accessMiddleware } from '../middlewares/access.middleware.js';
import { Role } from '../common/Role.js';

const router = Router();

router.get('/admin-only', accessMiddleware([Role.ADMIN]), (req, res) => {
    return res.json({ ok: true, user: req.payload });
});

export default router;
