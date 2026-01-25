import 'dotenv/config';

export type SameSiteValue = 'lax' | 'strict' | 'none';

const requireEnv = (key: string): string => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required env var: ${key}`);
    }
    return value;
};

const toNumber = (value: string | undefined, fallback: number): number => {
    if (!value) return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const toSameSite = (value: string | undefined): SameSiteValue => {
    const normalized = (value ?? 'lax').toLowerCase();
    if (normalized === 'strict' || normalized === 'none' || normalized === 'lax') {
        return normalized;
    }
    return 'lax';
};

export const env = {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: toNumber(process.env.PORT, 3000),
    jwtAccessSecret: requireEnv('JWT_ACCESS_SECRET'),
    jwtRefreshSecret: requireEnv('JWT_REFRESH_SECRET'),
    accessExpiresIn: process.env.ACCESS_EXPIRESIN ?? '15m',
    refreshExpiresIn: process.env.REFRESH_EXPIRESIN ?? '30d',
    algorithm: process.env.ALGORITHM ?? 'HS256',
    accessCookieName: process.env.ACCESS_COOKIE_NAME ?? 'access_token',
    refreshCookieName: process.env.REFRESH_COOKIE_NAME ?? 'refresh_token',
    cookieSameSite: toSameSite(process.env.COOKIE_SAMESITE),
    accessCookieMaxAgeMs: toNumber(process.env.ACCESS_COOKIE_MAX_AGE_MS, 15 * 60 * 1000),
    refreshCookieMaxAgeMs: toNumber(
        process.env.REFRESH_COOKIE_MAX_AGE_MS,
        30 * 24 * 60 * 60 * 1000
    ),
};
