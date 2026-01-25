import Offer from '../Models/Offer.js';
import Request from '../Models/Request.js';
import Match from '../Models/Match.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getStats = asyncHandler(async (_req, res) => {
    const [offers, requests, matches] = await Promise.all([
        Offer.countDocuments(),
        Request.countDocuments(),
        Match.countDocuments(),
    ]);

    res.json({
        success: true,
        message: 'تم جلب البيانات بنجاح',
        data: { offers, requests, matches },
    });
});

export const getMostRequestedAreas = asyncHandler(async (_req, res) => {
    const results = await Request.aggregate([
        {
            $group: {
                _id: { city: '$city', district: '$district' },
                count: { $sum: 1 },
            },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
    ]);

    const data = results.map((item) => ({
        city: item._id.city,
        district: item._id.district,
        count: item.count,
    }));

    res.json({ success: true, message: 'تم جلب البيانات بنجاح', data });
});

export const getMostActiveBrokers = asyncHandler(async (_req, res) => {
    const results = await Offer.aggregate([
        {
            $group: {
                _id: {
                    $cond: [
                        { $ifNull: ['$brokerId', false] },
                        '$brokerId',
                        '$brokerName',
                    ],
                },
                brokerId: { $first: '$brokerId' },
                brokerName: { $first: '$brokerName' },
                count: { $sum: 1 },
            },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
    ]);

    const data = results.map((item) => ({
        brokerId: item.brokerId ? String(item.brokerId) : undefined,
        brokerName: item.brokerName || '',
        count: item.count,
    }));

    res.json({ success: true, message: 'تم جلب البيانات بنجاح', data });
});
