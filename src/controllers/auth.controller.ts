import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../Models/User.js';
import type { payload } from '../common/IPayload.js';
import { isEmail, isNonEmptyString } from '../utils/validators.js';
import { env } from '../config/env.js';

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
    res.cookie(env.refreshCookieName, token, getCookieOptions(env.refreshCookieMaxAgeMs, '/api/auth'));
};

const generateTokens = (data: payload) => {
    const algorithm = env.algorithm as jwt.Algorithm;
    const accessExpiresIn = env.accessExpiresIn as Exclude<
        jwt.SignOptions['expiresIn'],
        undefined
    >;
    const refreshExpiresIn = env.refreshExpiresIn as Exclude<
        jwt.SignOptions['expiresIn'],
        undefined
    >;

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

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!isEmail(email) || !isNonEmptyString(password)) {
        return res.status(400).json({ success: false, message: 'بيانات غير صالحة' });
    }

    const user = await User.findOne({ email }).exec();
    if (!user) {
        return res
            .status(401)
            .json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res
            .status(401)
            .json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const data: payload = {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
    };

    try {
        const { accessToken, refreshToken } = generateTokens(data);
        setRefreshTokenCookie(res, refreshToken);
        setAccessTokenCookie(res, accessToken);

        return res.json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            data: { name: user.name, role: user.role },
        });
    } catch (_err) {
        return res.status(500).json({ success: false, message: 'خطأ داخلي في الخادم' });
    }
};

export const getAccessToken = (req: Request, res: Response) => {
    if (!req.payload) {
        return res.status(403).json({ success: false, message: 'الجلسة غير صالحة' });
    }

    try {
        const { accessToken, refreshToken } = generateTokens(req.payload);
        setRefreshTokenCookie(res, refreshToken);
        setAccessTokenCookie(res, accessToken);

        return res.json({ success: true, message: 'تم تحديث الجلسة بنجاح' });
    } catch (_err) {
        return res.status(500).json({ success: false, message: 'خطأ داخلي في الخادم' });
    }
};
