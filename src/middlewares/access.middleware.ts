import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../common/Role.js';
import type { payload } from '../common/IPayload.js';
import { env } from '../config/env.js';

const getTokenFromCookies = (
    cookieHeader: string | undefined,
    cookieName: string
): string | undefined => {
    if (!cookieHeader) return undefined;
    const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
    const match = cookies.find((cookie) => cookie.startsWith(`${cookieName}=`));
    if (!match) return undefined;
    return match.substring(cookieName.length + 1);
};

export const accessMiddleware = (roles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const token = getTokenFromCookies(req.headers.cookie, env.accessCookieName);

        if (!token) {
            return res.status(403).json({ success: false, message: 'معلومات الجلسة مفقودة' });
        }

        try {
            const decoded = jwt.verify(token, env.jwtAccessSecret);

            if (typeof decoded === 'string' || !decoded || !('role' in decoded)) {
                return res.status(403).json({ success: false, message: 'الجلسة غير صالحة' });
            }

            if (!roles.includes((decoded as payload).role)) {
                return res.status(403).json({ success: false, message: 'غير مصرح' });
            }

            req.payload = decoded as payload;
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
};
