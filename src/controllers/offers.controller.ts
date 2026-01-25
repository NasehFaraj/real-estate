import { Types } from 'mongoose';
import Offer from '../Models/Offer.js';
import { Role } from '../common/Role.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isNonEmptyString, isValidNumber } from '../utils/validators.js';
import { buildFilter } from '../utils/filters.js';

const parseNumber = (value: unknown): number | null => {
    if (!isValidNumber(value)) return null;
    return Number(value);
};

const parseBoolean = (value: unknown): boolean | null => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return null;
};

export const createOffer = asyncHandler(async (req, res) => {
    const payload = req.payload;
    if (!payload) {
        res.status(403).json({ success: false, message: 'غير مصرح' });
        return;
    }

    const body = req.body as Record<string, unknown>;
    const areaFromValue =
        body.areaFrom ??
        (body.areaForm !== undefined && body.areaFrom === undefined ? body.areaForm : undefined);

    const propertyType = body.propertyType;
    const category = body.category;
    const status = body.status;
    const city = body.city;
    const district = body.district;
    const coordinates = isNonEmptyString(body.coordinates) ? body.coordinates : '';
    const areaFrom = parseNumber(areaFromValue);
    const areaTo = parseNumber(body.areaTo);
    const pricePerMeter = parseNumber(body.pricePerMeter);
    const priceTotal = parseNumber(body.priceTotal);
    const offerStatus = body.offerStatus === undefined ? true : parseBoolean(body.offerStatus);

    if (
        !isNonEmptyString(propertyType) ||
        !isNonEmptyString(category) ||
        !isNonEmptyString(status) ||
        !isNonEmptyString(city) ||
        !isNonEmptyString(district) ||
        areaFrom === null ||
        areaTo === null ||
        pricePerMeter === null ||
        priceTotal === null ||
        offerStatus === null
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
        category,
        status,
        city,
        district,
        coordinates,
        areaFrom,
        areaTo,
        pricePerMeter,
        priceTotal,
        offerStatus,
        brokerName,
        ...(brokerId ? { brokerId } : {}),
    };

    const offer = await Offer.create(data);

    res.status(201).json({ success: true, message: 'تمت الإضافة بنجاح', data: offer });
});

const allowedOfferFields = {
    propertyType: 'string',
    category: 'string',
    status: 'string',
    city: 'string',
    district: 'string',
    coordinates: 'string',
    brokerName: 'string',
    brokerId: 'objectId',
    areaFrom: 'number',
    areaTo: 'number',
    pricePerMeter: 'number',
    priceTotal: 'number',
    offerStatus: 'boolean',
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

export const listOffers = asyncHandler(async (req, res) => {
    const { filter, error } = buildFilter(allowedOfferFields, req.query);
    if (error) {
        res.status(400).json({ success: false, message: error });
        return;
    }

    const { page, limit, sortBy, sortDir } = getPagination(req.query);
    const finalFilter = filter ?? {};
    const [items, total] = await Promise.all([
        Offer.find(finalFilter)
            .sort({ [sortBy]: sortDir === 'asc' ? 1 : -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Offer.countDocuments(finalFilter),
    ]);

    res.json({
        success: true,
        message: 'تم جلب البيانات بنجاح',
        data: { items, page, limit, total },
    });
});

export const listMyOffers = asyncHandler(async (req, res) => {
    const payload = req.payload;
    if (!payload) {
        res.status(403).json({ success: false, message: 'غير مصرح' });
        return;
    }

    const { filter, error } = buildFilter(allowedOfferFields, req.query);
    if (error) {
        res.status(400).json({ success: false, message: error });
        return;
    }

    const { page, limit, sortBy, sortDir } = getPagination(req.query);
    const finalFilter = { ...(filter ?? {}), brokerId: payload.id };
    const [items, total] = await Promise.all([
        Offer.find(finalFilter)
            .sort({ [sortBy]: sortDir === 'asc' ? 1 : -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Offer.countDocuments(finalFilter),
    ]);

    res.json({
        success: true,
        message: 'تم جلب البيانات بنجاح',
        data: { items, page, limit, total },
    });
});

export const getOfferById = asyncHandler(async (req, res) => {
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

    const offer = await Offer.findById(id).lean();
    if (!offer) {
        res.status(404).json({ success: false, message: 'العنصر غير موجود' });
        return;
    }

    if (payload.role === Role.BROKER) {
        const brokerId = offer.brokerId?.toString();
        if (!brokerId || brokerId !== payload.id) {
            res.status(403).json({ success: false, message: 'غير مصرح' });
            return;
        }
    }

    res.json({ success: true, message: 'تم جلب البيانات بنجاح', data: offer });
});

export const deleteOffer = asyncHandler(async (req, res) => {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    if (!id || !Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'معرف غير صالح' });
        return;
    }

    const deleted = await Offer.findByIdAndDelete(id).lean();
    if (!deleted) {
        res.status(404).json({ success: false, message: 'العنصر غير موجود' });
        return;
    }

    res.json({ success: true, message: 'تم الحذف بنجاح' });
});
