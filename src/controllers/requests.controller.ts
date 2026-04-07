import { Types } from 'mongoose';
import Request from '../Models/Request.js';
import Match from '../Models/Match.js';
import { Role } from '../common/Role.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isNonEmptyString, isValidNumber } from '../utils/validators.js';
import { buildFilter } from '../utils/filters.js';
import { runMatchingForRequest } from '../utils/matching.js';

const parseNumber = (value: unknown): number | null => {
    if (!isValidNumber(value)) return null;
    return Number(value);
};

const refreshMatchesForRequest = async (request: typeof Request.prototype) => {
    await Match.deleteMany({ requestId: request._id });
    await runMatchingForRequest(request);
};

export const createRequest = asyncHandler(async (req, res) => {
    const payload = req.payload;
    if (!payload) {
        res.status(403).json({ success: false, message: 'غير مصرح' });
        return;
    }

    const body = req.body as Record<string, unknown>;
    const propertyType = body.propertyType;
    const usage = body.usage;
    const status = body.status;
    const priority = body.priority;
    const city = body.city;
    const district = body.district;
    const minArea = parseNumber(body.minArea);
    const maxArea = parseNumber(body.maxArea);
    const budget = parseNumber(body.budget);

    if (
        !isNonEmptyString(propertyType) ||
        !isNonEmptyString(usage) ||
        !isNonEmptyString(status) ||
        !isNonEmptyString(priority) ||
        !isNonEmptyString(city) ||
        !isNonEmptyString(district) ||
        minArea === null ||
        maxArea === null ||
        budget === null
    ) {
        res.status(400).json({ success: false, message: 'بيانات غير صالحة' });
        return;
    }

    let brokerName = '';
    let brokerId: Types.ObjectId | undefined;

    if (payload.role === Role.BROKER) {
        brokerName = payload.name;
        brokerId = new Types.ObjectId(payload.id);
    } else {
        brokerName = isNonEmptyString(body.brokerName) ? String(body.brokerName) : '';
        if (isNonEmptyString(body.brokerId) && Types.ObjectId.isValid(String(body.brokerId))) {
            brokerId = new Types.ObjectId(String(body.brokerId));
        } else if (body.brokerId !== undefined && !Types.ObjectId.isValid(String(body.brokerId))) {
            res.status(400).json({ success: false, message: 'معرف غير صالح' });
            return;
        }
    }

    const data = {
        propertyType,
        usage,
        status,
        priority,
        city,
        district,
        minArea,
        maxArea,
        budget,
        brokerName,
        ...(brokerId ? { brokerId } : {}),
    };

    const request = await Request.create(data);

    // Run matching asynchronously
    runMatchingForRequest(request).catch((err) =>
        console.error('Matching failed for request ' + request._id, err)
    );

    res.status(201).json({ success: true, message: 'تمت الإضافة بنجاح', data: request });
});

const allowedRequestFields = {
    propertyType: 'string',
    usage: 'string',
    status: 'string',
    priority: 'string',
    city: 'string',
    district: 'string',
    brokerName: 'string',
    brokerId: 'objectId',
    minArea: 'number',
    maxArea: 'number',
    budget: 'number',
    createdAt: 'date',
} as const;

const getPagination = (query: Record<string, unknown>) => {
    const page = isValidNumber(query.page) ? Math.max(1, Number(query.page)) : 1;
    const limitRaw = isValidNumber(query.limit) ? Number(query.limit) : 20;
    const limit = Math.min(100, Math.max(1, limitRaw));
    const sortBy = isNonEmptyString(query.sortBy) ? String(query.sortBy) : 'createdAt';
    const sortDir = query.sortDir === 'asc' ? 'asc' : 'desc';
    return { page, limit, sortBy, sortDir };
};

export const listRequests = asyncHandler(async (req, res) => {
    const { filter, error } = buildFilter(allowedRequestFields, req.query);
    if (error) {
        res.status(400).json({ success: false, message: error });
        return;
    }

    const { page, limit, sortBy, sortDir } = getPagination(req.query);
    const finalFilter = filter ?? {};
    const [items, total] = await Promise.all([
        Request.find(finalFilter)
            .sort({ [sortBy]: sortDir === 'asc' ? 1 : -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Request.countDocuments(finalFilter),
    ]);

    res.json({
        success: true,
        message: 'تم جلب البيانات بنجاح',
        data: { items, page, limit, total },
    });
});

export const listMyRequests = asyncHandler(async (req, res) => {
    const payload = req.payload;
    if (!payload) {
        res.status(403).json({ success: false, message: 'غير مصرح' });
        return;
    }

    const { filter, error } = buildFilter(allowedRequestFields, req.query);
    if (error) {
        res.status(400).json({ success: false, message: error });
        return;
    }

    const { page, limit, sortBy, sortDir } = getPagination(req.query);
    const finalFilter = { ...(filter ?? {}), brokerId: payload.id };
    const [items, total] = await Promise.all([
        Request.find(finalFilter)
            .sort({ [sortBy]: sortDir === 'asc' ? 1 : -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Request.countDocuments(finalFilter),
    ]);

    res.json({
        success: true,
        message: 'تم جلب البيانات بنجاح',
        data: { items, page, limit, total },
    });
});

export const getRequestById = asyncHandler(async (req, res) => {
    const payload = req.payload;
    if (!payload) {
        res.status(403).json({ success: false, message: 'غير مصرح' });
        return;
    }

    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    if (!id || !Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'معرف غير صالح' });
        return;
    }

    const request = await Request.findById(id).lean();
    if (!request) {
        res.status(404).json({ success: false, message: 'العنصر غير موجود' });
        return;
    }

    if (payload.role === Role.BROKER) {
        const brokerId = request.brokerId?.toString();
        if (!brokerId || brokerId !== payload.id) {
            res.status(403).json({ success: false, message: 'غير مصرح' });
            return;
        }
    }

    res.json({ success: true, message: 'تم جلب البيانات بنجاح', data: request });
});

export const deleteRequest = asyncHandler(async (req, res) => {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    if (!id || !Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'معرف غير صالح' });
        return;
    }

    const deleted = await Request.findByIdAndDelete(id).lean();
    if (!deleted) {
        res.status(404).json({ success: false, message: 'العنصر غير موجود' });
        return;
    }

    res.json({ success: true, message: 'تم الحذف بنجاح' });
});

export const updateRequest = asyncHandler(async (req, res) => {
    const payload = req.payload;
    if (!payload) {
        res.status(403).json({ success: false, message: 'غير مصرح' });
        return;
    }

    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    if (!id || !Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'معرف غير صالح' });
        return;
    }

    const requestDoc = await Request.findById(id).exec();
    if (!requestDoc) {
        res.status(404).json({ success: false, message: 'العنصر غير موجود' });
        return;
    }

    if (payload.role === Role.BROKER) {
        const brokerId = requestDoc.brokerId?.toString();
        if (!brokerId || brokerId !== payload.id) {
            res.status(403).json({ success: false, message: 'غير مصرح' });
            return;
        }
    }

    const body = req.body as Record<string, unknown>;
    const updates: Record<string, unknown> = {};

    if (body.propertyType !== undefined) {
        if (!isNonEmptyString(body.propertyType)) {
            res.status(400).json({ success: false, message: 'بيانات غير صالحة' });
            return;
        }
        updates.propertyType = body.propertyType;
    }

    if (body.usage !== undefined) {
        if (!isNonEmptyString(body.usage)) {
            res.status(400).json({ success: false, message: 'بيانات غير صالحة' });
            return;
        }
        updates.usage = body.usage;
    }

    if (body.status !== undefined) {
        if (!isNonEmptyString(body.status)) {
            res.status(400).json({ success: false, message: 'بيانات غير صالحة' });
            return;
        }
        updates.status = body.status;
    }

    if (body.priority !== undefined) {
        if (!isNonEmptyString(body.priority)) {
            res.status(400).json({ success: false, message: 'بيانات غير صالحة' });
            return;
        }
        updates.priority = body.priority;
    }

    if (body.city !== undefined) {
        if (!isNonEmptyString(body.city)) {
            res.status(400).json({ success: false, message: 'بيانات غير صالحة' });
            return;
        }
        updates.city = body.city;
    }

    if (body.district !== undefined) {
        if (!isNonEmptyString(body.district)) {
            res.status(400).json({ success: false, message: 'بيانات غير صالحة' });
            return;
        }
        updates.district = body.district;
    }

    if (body.minArea !== undefined) {
        const minArea = parseNumber(body.minArea);
        if (minArea === null) {
            res.status(400).json({ success: false, message: 'بيانات غير صالحة' });
            return;
        }
        updates.minArea = minArea;
    }

    if (body.maxArea !== undefined) {
        const maxArea = parseNumber(body.maxArea);
        if (maxArea === null) {
            res.status(400).json({ success: false, message: 'بيانات غير صالحة' });
            return;
        }
        updates.maxArea = maxArea;
    }

    if (body.budget !== undefined) {
        const budget = parseNumber(body.budget);
        if (budget === null) {
            res.status(400).json({ success: false, message: 'بيانات غير صالحة' });
            return;
        }
        updates.budget = budget;
    }

    if (payload.role !== Role.BROKER) {
        if (body.brokerName !== undefined) {
            if (!isNonEmptyString(body.brokerName)) {
                res.status(400).json({ success: false, message: 'بيانات غير صالحة' });
                return;
            }
            updates.brokerName = body.brokerName;
        }

        if (body.brokerId !== undefined) {
            if (body.brokerId === null || body.brokerId === '') {
                updates.brokerId = undefined;
            } else if (isNonEmptyString(body.brokerId) && Types.ObjectId.isValid(body.brokerId)) {
                updates.brokerId = new Types.ObjectId(body.brokerId);
            } else {
                res.status(400).json({ success: false, message: 'معرف غير صالح' });
                return;
            }
        }
    }

    if (Object.keys(updates).length === 0) {
        res.status(400).json({ success: false, message: 'لا توجد بيانات للتحديث' });
        return;
    }

    Object.assign(requestDoc, updates);
    await requestDoc.save();
    await refreshMatchesForRequest(requestDoc);

    res.json({ success: true, message: 'تم التحديث بنجاح', data: requestDoc });
});
