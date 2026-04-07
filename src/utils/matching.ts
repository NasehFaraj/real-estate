import { Types } from 'mongoose';
import Offer from '../Models/Offer.js';
import type { IOffer } from '../Models/Offer.js';
import Request from '../Models/Request.js';
import type { IRequest } from '../Models/Request.js';
import Match from '../Models/Match.js';

const DEBUG = process.env.DEBUG_MATCHING === 'true';

const log = (message: string, data?: any) => {
    if (DEBUG) {
        console.log(`[MATCHING] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
};

export const runMatchingForOffer = async (offer: IOffer & { _id: Types.ObjectId }) => {
    log('Starting matching for Offer', { id: offer._id, ...offer });

    try {
        // Query to find matching Requests
        const query = {
            city: offer.city,
            district: offer.district,
            propertyType: offer.propertyType,
            status: 'open', // Only match open requests
            // Area Overlap Logic:
            // Request minArea <= Offer areaTo AND Request maxArea >= Offer areaFrom
            minArea: { $lte: offer.areaTo },
            maxArea: { $gte: offer.areaFrom },
            // Price Logic:
            // Request budget >= Offer priceTotal
            budget: { $gte: offer.priceTotal },
        };

        log('Request Query', query);

        const requests = await Request.find(query);
        log(`Found ${requests.length} matching candidates`);

        const matchesToCreate = [];
        for (const req of requests) {
            // Create match for Offer owner
            if (offer.brokerId) {
                matchesToCreate.push({
                    offerId: offer._id,
                    requestId: req._id,
                    brokerId: offer.brokerId,
                });
            }
            // Create match for Request owner (if different)
            if (
                req.brokerId &&
                (!offer.brokerId || req.brokerId.toString() !== offer.brokerId.toString())
            ) {
                matchesToCreate.push({
                    offerId: offer._id,
                    requestId: req._id,
                    brokerId: req.brokerId,
                });
            }
        }

        if (matchesToCreate.length > 0) {
            await Match.insertMany(matchesToCreate);
            log(`Created ${matchesToCreate.length} matches`);
        }
    } catch (error) {
        console.error('[MATCHING] Error running matching for Offer:', error);
    }
};

export const runMatchingForRequest = async (request: IRequest & { _id: Types.ObjectId }) => {
    log('Starting matching for Request', { id: request._id, ...request });

    try {
        // Query to find matching Offers
        const query = {
            city: request.city,
            district: request.district,
            propertyType: request.propertyType,
            status: 'available', // Only match available offers
            // Area Overlap Logic:
            // Offer areaFrom <= Request maxArea AND Offer areaTo >= Request minArea
            areaFrom: { $lte: request.maxArea },
            areaTo: { $gte: request.minArea },
            // Price Logic:
            // Offer priceTotal <= Request budget
            priceTotal: { $lte: request.budget },
        };

        log('Offer Query', query);

        const offers = await Offer.find(query);
        log(`Found ${offers.length} matching candidates`);

        const matchesToCreate = [];
        for (const off of offers) {
            // Create match for Request owner
            if (request.brokerId) {
                matchesToCreate.push({
                    offerId: off._id,
                    requestId: request._id,
                    brokerId: request.brokerId,
                });
            }
            // Create match for Offer owner (if different)
            if (
                off.brokerId &&
                (!request.brokerId || off.brokerId.toString() !== request.brokerId.toString())
            ) {
                matchesToCreate.push({
                    offerId: off._id,
                    requestId: request._id,
                    brokerId: off.brokerId,
                });
            }
        }

        if (matchesToCreate.length > 0) {
            await Match.insertMany(matchesToCreate);
            log(`Created ${matchesToCreate.length} matches`);
        }
    } catch (error) {
        console.error('[MATCHING] Error running matching for Request:', error);
    }
};
