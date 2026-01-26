import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import { Role, normalizeRole } from '../common/Role.js';
import type { payload } from '../common/IPayload.js';
import { env } from '../config/env.js';

const getCookieName = (kind: 'access' | 'refresh') => {
    if (kind === 'access') return env.accessCookieName;
    return env.refreshCookieName;
};

const verifyToken = (token: string, secret: string) => {
    return jwt.verify(token, secret) as JwtPayload;
};

export const refreshAuth = (req: Request, res: Response, next: NextFunction) => {
    const cookieName = getCookieName('refresh');
    const token = req.cookies?.[cookieName];

    if (!token) {
        return res.status(403).json({ success: false, message: 'الجلسة مفقودة' });
    }

    try {
        const decoded = verifyToken(token, env.jwtRefreshSecret);
        if (
            !decoded ||
            typeof decoded === 'string' ||
            !decoded.role ||
            !decoded.id ||
            !decoded.name
        ) {
            return res.status(403).json({ success: false, message: 'الجلسة غير صالحة' });
        }

        const parsedRole = normalizeRole(decoded.role);
        if (!parsedRole) {
            return res.status(403).json({ success: false, message: 'الجلسة غير صالحة' });
        }

        req.payload = { ...(decoded as payload), role: parsedRole };
        return next();
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ success: false, message: 'انتهت صلاحية الجلسة' });
        }

        if (err instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ success: false, message: 'الجلسة غير صالحة' });
        }

        return res.status(500).json({ success: false, message: 'خطأ داخلي في الخادم' });
    }
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const cookieName = getCookieName('access');
    const token = req.cookies?.[cookieName];

    if (!token) {
        return res.status(403).json({ success: false, message: 'معلومات الجلسة مفقودة' });
    }

    try {
        const decoded = verifyToken(token, env.jwtAccessSecret);
        if (
            !decoded ||
            typeof decoded === 'string' ||
            !decoded.role ||
            !decoded.id ||
            !decoded.name
        ) {
            return res.status(403).json({ success: false, message: 'الجلسة غير صالحة' });
        }

        const parsedRole = normalizeRole(decoded.role);
        if (!parsedRole) {
            return res.status(403).json({ success: false, message: 'الجلسة غير صالحة' });
        }

        req.payload = { ...(decoded as payload), role: parsedRole };
        return next();
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ success: false, message: 'انتهت صلاحية الجلسة' });
        }

        if (err instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ success: false, message: 'الجلسة غير صالحة' });
        }

        return res.status(500).json({ success: false, message: 'خطأ داخلي في الخادم' });
    }
};

export const requireRole = (roles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.payload || !roles.includes(req.payload.role)) {
            return res.status(403).json({ success: false, message: 'غير مصرح' });
        }

        return next();
    };
};
