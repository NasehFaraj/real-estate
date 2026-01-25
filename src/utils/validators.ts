export const isNonEmptyString = (value: unknown): value is string => {
    return typeof value === 'string' && value.trim().length > 0;
};

export const isEmail = (value: unknown): value is string => {
    if (!isNonEmptyString(value)) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

export const isValidNumber = (value: unknown): value is number => {
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num);
};
