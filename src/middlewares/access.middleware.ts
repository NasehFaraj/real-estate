import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../common/Role.js';
import type { payload } from '../common/IPayload.js';
import { env } from '../config/env.js';

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

const getTokenFromRequest = (req: Request): string | undefined => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.slice('Bearer '.length).trim();
    }

    const cookieName = env.accessCookieName;
    const cookieToken = req.cookies?.[cookieName];
    if (cookieToken) return cookieToken;

    return getTokenFromCookiesHeader(req.headers.cookie, cookieName);
};

const shouldLogAuth = env.nodeEnv !== 'production';

const logAuth = (req: Request, message: string) => {
    if (!shouldLogAuth) return;
    const requestId = req.requestId ?? '-';
    console.info(`[auth] ${requestId} ${req.method} ${req.originalUrl} ${message}`);
};

export const accessMiddleware = (roles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const token = getTokenFromRequest(req);

        if (!token) {
            logAuth(req, 'missing access token');
            return res.status(401).json({ success: false, message: 'معلومات الجلسة مفقودة' });
        }

        try {
            const decoded = jwt.verify(token, env.jwtAccessSecret);

            if (typeof decoded === 'string' || !decoded || !('role' in decoded)) {
                logAuth(req, 'invalid access token payload');
                return res.status(401).json({ success: false, message: 'الجلسة غير صالحة' });
            }

            if (!roles.includes((decoded as payload).role)) {
                logAuth(
                    req,
                    `forbidden role=${(decoded as payload).role} allowed=${roles.join(',')}`
                );
                return res.status(403).json({ success: false, message: 'غير مصرح' });
            }

            req.payload = decoded as payload;
            logAuth(req, `authorized role=${(decoded as payload).role}`);
            return next();
        } catch (err) {
            if (err instanceof jwt.TokenExpiredError) {
                logAuth(req, 'access token expired');
                return res.status(401).json({ success: false, message: 'انتهت صلاحية الجلسة' });
            }

            if (err instanceof jwt.JsonWebTokenError) {
                logAuth(req, 'access token invalid');
                return res.status(401).json({ success: false, message: 'الجلسة غير صالحة' });
            }

            return res.status(500).json({ success: false, message: 'خطأ داخلي في الخادم' });
        }
    };
};
