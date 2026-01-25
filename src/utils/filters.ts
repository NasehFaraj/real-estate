import { Types } from 'mongoose';
import { isValidNumber, isNonEmptyString } from './validators.js';

type FieldType = 'string' | 'number' | 'boolean' | 'objectId' | 'date';

type AllowedFieldsConfig = Record<string, FieldType>;

type BuildResult = { filter: Record<string, unknown>; error?: string };

const parseBoolean = (value: unknown): boolean | null => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return null;
};

const parseDate = (value: unknown): Date | null => {
    if (!isNonEmptyString(value)) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

export const buildFilter = (
    allowedFields: AllowedFieldsConfig,
    query: Record<string, unknown>
): BuildResult => {
    const filter: Record<string, unknown> = {};

    for (const [key, rawValue] of Object.entries(query)) {
        if (rawValue === undefined) continue;
        if (['page', 'limit', 'sortBy', 'sortDir'].includes(key)) continue;

        let field = key;
        let op: 'exact' | 'like' | 'min' | 'max' = 'exact';

        if (key.endsWith('_like')) {
            field = key.slice(0, -5);
            op = 'like';
        } else if (key.endsWith('_min')) {
            field = key.slice(0, -4);
            op = 'min';
        } else if (key.endsWith('_max')) {
            field = key.slice(0, -4);
            op = 'max';
        }

        const type = allowedFields[field];
        if (!type) continue;

        if (type === 'string') {
            const value = String(rawValue);
            if (op === 'like') {
                filter[field] = { $regex: value, $options: 'i' };
            } else if (op === 'exact') {
                filter[field] = value;
            }
            continue;
        }

        if (type === 'number') {
            if (!isValidNumber(rawValue)) return { filter: {}, error: 'بيانات غير صالحة' };
            const value = Number(rawValue);
            if (op === 'min') {
                filter[field] = { ...(filter[field] as object), $gte: value };
            } else if (op === 'max') {
                filter[field] = { ...(filter[field] as object), $lte: value };
            } else if (op === 'exact') {
                filter[field] = value;
            }
            continue;
        }

        if (type === 'boolean') {
            const parsed = parseBoolean(rawValue);
            if (parsed === null) return { filter: {}, error: 'بيانات غير صالحة' };
            if (op === 'exact') filter[field] = parsed;
            continue;
        }

        if (type === 'objectId') {
            const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
            if (!isNonEmptyString(value) || !Types.ObjectId.isValid(String(value))) {
                return { filter: {}, error: 'معرف غير صالح' };
            }
            if (op === 'exact') filter[field] = value;
            continue;
        }

        if (type === 'date') {
            const date = parseDate(rawValue);
            if (!date) return { filter: {}, error: 'بيانات غير صالحة' };
            if (op === 'min') {
                filter[field] = { ...(filter[field] as object), $gte: date };
            } else if (op === 'max') {
                filter[field] = { ...(filter[field] as object), $lte: date };
            } else if (op === 'exact') {
                filter[field] = date;
            }
        }
    }

    return { filter };
};
