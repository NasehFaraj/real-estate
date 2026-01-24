export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;
    public details?: unknown;

    constructor(message: string, statusCode: number, details?: unknown) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = statusCode >= 400 && statusCode < 500;
        this.details = details;
    }
}
