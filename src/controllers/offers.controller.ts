import { Types } from 'mongoose';
import Offer from '../Models/Offer.js';
import Match from '../Models/Match.js';
import { Role } from '../common/Role.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isNonEmptyString, isValidNumber } from '../utils/validators.js';
import { buildFilter } from '../utils/filters.js';
import { runMatchingForOffer } from '../utils/matching.js';

const parseNumber = (value: unknown): number | null => {
    if (!isValidNumber(value)) return null;
    return Number(value);
};

const parseBoolean = (value: unknown): boolean | null => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return null;
};

const refreshMatchesForOffer = async (offer: typeof Offer.prototype) => {
    await Match.deleteMany({ offerId: offer._id });
    await runMatchingForOffer(offer);
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

    // Run matching asynchronously
    runMatchingForOffer(offer).catch((err) =>
        console.error('Matching failed for offer ' + offer._id, err)
    );

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

export const updateOffer = asyncHandler(async (req, res) => {
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

    const offer = await Offer.findById(id).exec();
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

    const body = req.body as Record<string, unknown>;
    const updates: Record<string, unknown> = {};

    if (body.propertyType !== undefined) {
        if (!isNonEmptyString(body.propertyType)) {
            res.status(400).json({ success: false, message: 'بيانات غير صالحة' });
            return;
        }
        updates.propertyType = body.propertyType;
    }

    if (body.category !== undefined) {
        if (!isNonEmptyString(body.category)) {
            res.status(400).json({ success: false, message: 'بيانات غير صالحة' });
            return;
        }
        updates.category = body.category;
    }

    if (body.status !== undefined) {
        if (!isNonEmptyString(body.status)) {
            res.status(400).json({ success: false, message: 'بيانات غير صالحة' });
            return;
        }
        updates.status = body.status;
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

    if (body.coordinates !== undefined) {
        if (typeof body.coordinates !== 'string') {
            res.status(400).json({ success: false, message: 'بيانات غير صالحة' });
            return;
        }
        updates.coordinates = body.coordinates;
    }

    const areaFromValue =
        body.areaFrom ??
        (body.areaForm !== undefined && body.areaFrom === undefined ? body.areaForm : undefined);
    if (areaFromValue !== undefined) {
        const areaFrom = parseNumber(areaFromValue);
        if (areaFrom === null) {
            res.status(400).json({ success: false, message: 'بيانات غير صالحة' });
            return;
        }
        updates.areaFrom = areaFrom;
    }

    if (body.areaTo !== undefined) {
        const areaTo = parseNumber(body.areaTo);
        if (areaTo === null) {
            res.status(400).json({ success: false, message: 'بيانات غير صالحة' });
            return;
        }
        updates.areaTo = areaTo;
    }

    if (body.pricePerMeter !== undefined) {
        const pricePerMeter = parseNumber(body.pricePerMeter);
        if (pricePerMeter === null) {
            res.status(400).json({ success: false, message: 'بيانات غير صالحة' });
            return;
        }
        updates.pricePerMeter = pricePerMeter;
    }

    if (body.priceTotal !== undefined) {
        const priceTotal = parseNumber(body.priceTotal);
        if (priceTotal === null) {
            res.status(400).json({ success: false, message: 'بيانات غير صالحة' });
            return;
        }
        updates.priceTotal = priceTotal;
    }

    if (body.offerStatus !== undefined) {
        const offerStatus = parseBoolean(body.offerStatus);
        if (offerStatus === null) {
            res.status(400).json({ success: false, message: 'بيانات غير صالحة' });
            return;
        }
        updates.offerStatus = offerStatus;
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

    Object.assign(offer, updates);
    await offer.save();
    await refreshMatchesForOffer(offer);

    res.json({ success: true, message: 'تم التحديث بنجاح', data: offer });
});
