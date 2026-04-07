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

const getTokenFromCookiesHeader = (
    cookieHeader: string | undefined,
    cookieName: string
): string | undefined => {
    if (!cookieHeader) return undefined;
    const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
    const match = cookies.find((cookie) => cookie.startsWith(`${cookieName}=`));
    if (!match) return undefined;
    return match.substring(cookieName.length + 1);
};

const verifyToken = (token: string, secret: string) => {
    return jwt.verify(token, secret) as JwtPayload;
};

export const refreshAuth = (req: Request, res: Response, next: NextFunction) => {
    const cookieName = getCookieName('refresh');
    const token =
        req.cookies?.[cookieName] ?? getTokenFromCookiesHeader(req.headers.cookie, cookieName);

    if (env.authDebug) {
        const requestId = req.requestId ?? '-';
        const cookieHeaderPresent = Boolean(req.headers.cookie);
        const cookiesObjectPresent = Boolean(req.cookies);
        const cookieKeys = req.cookies ? Object.keys(req.cookies) : [];
        console.info(
            `[refresh] ${requestId} cookieHeader=${cookieHeaderPresent} cookiesObject=${cookiesObjectPresent} cookieKeys=${cookieKeys.join(',') || '-'}`
        );
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'الجلسة مفقودة' });
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
            return res.status(401).json({ success: false, message: 'الجلسة غير صالحة' });
        }

        const parsedRole = normalizeRole(decoded.role);
        if (!parsedRole) {
            return res.status(401).json({ success: false, message: 'الجلسة غير صالحة' });
        }

        req.payload = { ...(decoded as payload), role: parsedRole };
        return next();
    } catch (err) {
        if (env.authDebug) {
            const requestId = req.requestId ?? '-';
            console.error(`[refresh] ${requestId} verify failed`);
            console.error(err);
        }
        if (err instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ success: false, message: 'انتهت صلاحية الجلسة' });
        }

        if (err instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ success: false, message: 'الجلسة غير صالحة' });
        }

        return res.status(401).json({ success: false, message: 'الجلسة غير صالحة' });
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
