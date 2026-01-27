import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User, { type IUser } from '../Models/User.js';
import type { payload } from '../common/IPayload.js';
import { normalizeRole } from '../common/Role.js';
import { isEmail, isNonEmptyString } from '../utils/validators.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

const getCookieOptions = (maxAge: number, path: string) => {
    return {
        httpOnly: true,
        secure: env.nodeEnv === 'production',
        sameSite: env.cookieSameSite,
        maxAge,
        path,
    } as const;
};

const setAccessTokenCookie = (res: Response, token: string) => {
    res.cookie(env.accessCookieName, token, getCookieOptions(env.accessCookieMaxAgeMs, '/'));
};

const setRefreshTokenCookie = (res: Response, token: string) => {
    res.cookie(
        env.refreshCookieName,
        token,
        getCookieOptions(env.refreshCookieMaxAgeMs, '/api/auth')
    );
};

const buildPayload = (user: IUser & { _id: unknown }, role: payload['role']): payload => {
    return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role,
    };
};

const generateTokens = (user: IUser & { _id: unknown }, role: payload['role']) => {
    const algorithm = env.algorithm as jwt.Algorithm;
    const accessExpiresIn = env.accessExpiresIn as Exclude<jwt.SignOptions['expiresIn'], undefined>;
    const refreshExpiresIn = env.refreshExpiresIn as Exclude<
        jwt.SignOptions['expiresIn'],
        undefined
    >;
    const data = buildPayload(user, role);

    const accessToken = jwt.sign(data, env.jwtAccessSecret, {
        algorithm,
        expiresIn: accessExpiresIn,
    });
    const refreshToken = jwt.sign(data, env.jwtRefreshSecret, {
        algorithm,
        expiresIn: refreshExpiresIn,
    });

    return { accessToken, refreshToken };
};

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!isEmail(email) || !isNonEmptyString(password)) {
        res.status(400).json({ success: false, message: 'بيانات غير صالحة' });
        return;
    }

    const user = await User.findOne({ email }).exec();
    if (!user) {
        res.status(401).json({
            success: false,
            message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        });
        return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        res.status(401).json({
            success: false,
            message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        });
        return;
    }

    const parsedRole = normalizeRole(user.role);
    if (!parsedRole) {
        res.status(401).json({ success: false, message: 'الدور غير صالح' });
        return;
    }

    try {
        const { accessToken, refreshToken } = generateTokens(user, parsedRole);
        setRefreshTokenCookie(res, refreshToken);
        setAccessTokenCookie(res, accessToken);

        res.json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            data: { name: user.name, role: user.role },
        });
    } catch (err) {
        throw new AppError('خطأ داخلي في الخادم', 500, err);
    }
});

export const getAccessToken = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.payload?.id;
    if (!userId) {
        res.status(401).json({ success: false, message: 'الجلسة غير صالحة' });
        return;
    }

    try {
        const user = await User.findById(userId).exec();
        if (!user) {
            res.status(401).json({ success: false, message: 'الجلسة غير صالحة' });
            return;
        }

        const parsedRole = normalizeRole(user.role);
        if (!parsedRole) {
            res.status(401).json({ success: false, message: 'الجلسة غير صالحة' });
            return;
        }

        const { accessToken, refreshToken } = generateTokens(user, parsedRole);
        setRefreshTokenCookie(res, refreshToken);
        setAccessTokenCookie(res, accessToken);

        res.json({ success: true, message: 'تم تحديث الجلسة بنجاح' });
    } catch (err) {
        throw new AppError('خطأ داخلي في الخادم', 500, err);
    }
});
