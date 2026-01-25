import { Types } from 'mongoose';
import Match from '../Models/Match.js';
import { Role } from '../common/Role.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listMatches = asyncHandler(async (_req, res) => {
    const matches = await Match.find().lean();
    res.json({ success: true, message: 'تم جلب البيانات بنجاح', data: matches });
});

export const listMyMatches = asyncHandler(async (req, res) => {
    const payload = req.payload;
    if (!payload) {
        res.status(403).json({ success: false, message: 'غير مصرح' });
        return;
    }

    const matches = await Match.find({ brokerId: payload.id }).lean();
    res.json({ success: true, message: 'تم جلب البيانات بنجاح', data: matches });
});

export const getMatchById = asyncHandler(async (req, res) => {
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

    const match = await Match.findById(id).lean();
    if (!match) {
        res.status(404).json({ success: false, message: 'العنصر غير موجود' });
        return;
    }

    if (payload.role === Role.BROKER) {
        const brokerId = match.brokerId?.toString();
        if (!brokerId || brokerId !== payload.id) {
            res.status(403).json({ success: false, message: 'غير مصرح' });
            return;
        }
    }

    res.json({ success: true, message: 'تم جلب البيانات بنجاح', data: match });
});
