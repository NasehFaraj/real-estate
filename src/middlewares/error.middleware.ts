import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';

const logServerError = (req: Request, status: number, err: AppError | Error) => {
    const requestId = req.requestId ?? 'unknown';
    const method = req.method;
    const url = req.originalUrl ?? req.url;
    const details = err instanceof AppError ? err.details : undefined;

    console.error('❌ SERVER ERROR');
    console.error(`[${requestId}] ${method} ${url} -> ${status}`);
    console.error(err.stack || err.message);
    if (details) console.error('Details:', details);
};

export const errorMiddleware = (
    err: unknown,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    if (err instanceof AppError) {
        if (err.statusCode >= 500) {
            logServerError(req, err.statusCode, err);
            return res
                .status(500)
                .json({ success: false, message: 'خطأ داخلي في الخادم', requestId: req.requestId });
        }

        return res
            .status(err.statusCode)
            .json({ success: false, message: err.message, requestId: req.requestId });
    }

    logServerError(req, 500, err as Error);
    return res
        .status(500)
        .json({ success: false, message: 'خطأ داخلي في الخادم', requestId: req.requestId });
};
