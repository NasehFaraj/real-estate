import { Types } from 'mongoose';
import Request from '../Models/Request.js';
import { Role } from '../common/Role.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isNonEmptyString, isValidNumber } from '../utils/validators.js';

const parseNumber = (value: unknown): number | null => {
    if (!isValidNumber(value)) return null;
    return Number(value);
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

    res.status(201).json({ success: true, message: 'تمت الإضافة بنجاح', data: request });
});

const buildRequestFilters = (query: Record<string, unknown>) => {
    const filter: Record<string, unknown> = {};

    if (isNonEmptyString(query.propertyType)) filter.propertyType = query.propertyType;
    if (isNonEmptyString(query.usage)) filter.usage = query.usage;
    if (isNonEmptyString(query.status)) filter.status = query.status;
    if (isNonEmptyString(query.priority)) filter.priority = query.priority;
    if (isNonEmptyString(query.city)) filter.city = query.city;
    if (isNonEmptyString(query.district)) filter.district = query.district;

    if (query.minAreaMin !== undefined) {
        const value = parseNumber(query.minAreaMin);
        if (value === null) return { error: 'بيانات غير صالحة' };
        filter.minArea = { ...(filter.minArea as object), $gte: value };
    }

    if (query.maxAreaMax !== undefined) {
        const value = parseNumber(query.maxAreaMax);
        if (value === null) return { error: 'بيانات غير صالحة' };
        filter.maxArea = { ...(filter.maxArea as object), $lte: value };
    }

    if (query.budgetMax !== undefined) {
        const value = parseNumber(query.budgetMax);
        if (value === null) return { error: 'بيانات غير صالحة' };
        filter.budget = { ...(filter.budget as object), $lte: value };
    }

    return { filter };
};

export const listRequests = asyncHandler(async (req, res) => {
    const { filter, error } = buildRequestFilters(req.query);
    if (error) {
        res.status(400).json({ success: false, message: error });
        return;
    }

    const requests = await Request.find(filter ?? {}).lean();
    res.json({ success: true, message: 'تم جلب البيانات بنجاح', data: requests });
});

export const listMyRequests = asyncHandler(async (req, res) => {
    const payload = req.payload;
    if (!payload) {
        res.status(403).json({ success: false, message: 'غير مصرح' });
        return;
    }

    const { filter, error } = buildRequestFilters(req.query);
    if (error) {
        res.status(400).json({ success: false, message: error });
        return;
    }

    const requests = await Request.find({ ...(filter ?? {}), brokerId: payload.id }).lean();
    res.json({ success: true, message: 'تم جلب البيانات بنجاح', data: requests });
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
