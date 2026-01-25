import { Types } from 'mongoose';
import Offer from '../Models/Offer.js';
import { Role } from '../common/Role.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isNonEmptyString, isValidNumber } from '../utils/validators.js';

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
        body.areaFrom ?? (body.areaForm !== undefined && body.areaFrom === undefined ? body.areaForm : undefined);

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
    const offerStatus =
        body.offerStatus === undefined ? true : parseBoolean(body.offerStatus);

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

const buildOfferFilters = (query: Record<string, unknown>) => {
    const filter: Record<string, unknown> = {};

    if (isNonEmptyString(query.propertyType)) filter.propertyType = query.propertyType;
    if (isNonEmptyString(query.category)) filter.category = query.category;
    if (isNonEmptyString(query.status)) filter.status = query.status;
    if (isNonEmptyString(query.city)) filter.city = query.city;
    if (isNonEmptyString(query.district)) filter.district = query.district;

    if (query.offerStatus !== undefined) {
        const parsed = parseBoolean(query.offerStatus);
        if (parsed === null) return { error: 'بيانات غير صالحة' };
        filter.offerStatus = parsed;
    }

    if (query.areaFromMin !== undefined) {
        const value = parseNumber(query.areaFromMin);
        if (value === null) return { error: 'بيانات غير صالحة' };
        filter.areaFrom = { ...(filter.areaFrom as object), $gte: value };
    }

    if (query.areaToMax !== undefined) {
        const value = parseNumber(query.areaToMax);
        if (value === null) return { error: 'بيانات غير صالحة' };
        filter.areaTo = { ...(filter.areaTo as object), $lte: value };
    }

    if (query.priceTotalMax !== undefined) {
        const value = parseNumber(query.priceTotalMax);
        if (value === null) return { error: 'بيانات غير صالحة' };
        filter.priceTotal = { ...(filter.priceTotal as object), $lte: value };
    }

    if (query.pricePerMeterMax !== undefined) {
        const value = parseNumber(query.pricePerMeterMax);
        if (value === null) return { error: 'بيانات غير صالحة' };
        filter.pricePerMeter = { ...(filter.pricePerMeter as object), $lte: value };
    }

    return { filter };
};

export const listOffers = asyncHandler(async (req, res) => {
    const { filter, error } = buildOfferFilters(req.query);
    if (error) {
        res.status(400).json({ success: false, message: error });
        return;
    }

    const offers = await Offer.find(filter ?? {}).lean();
    res.json({ success: true, message: 'تم جلب البيانات بنجاح', data: offers });
});

export const listMyOffers = asyncHandler(async (req, res) => {
    const payload = req.payload;
    if (!payload) {
        res.status(403).json({ success: false, message: 'غير مصرح' });
        return;
    }

    const { filter, error } = buildOfferFilters(req.query);
    if (error) {
        res.status(400).json({ success: false, message: error });
        return;
    }

    const offers = await Offer.find({ ...(filter ?? {}), brokerId: payload.id }).lean();
    res.json({ success: true, message: 'تم جلب البيانات بنجاح', data: offers });
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
