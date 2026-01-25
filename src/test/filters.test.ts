import { describe, expect, it } from 'vitest';
import { createOffer, createRequest, createUser, loginAgent } from './helpers.js';

describe('Filtering and pagination', () => {
    it('filters offers and requests with exact, like, numeric, boolean, and dates', async () => {
        await createUser({
            name: 'Manager',
            email: 'manager@test.com',
            password: 'Pass1234',
            role: 'manager',
        });
        const manager = await loginAgent('manager@test.com', 'Pass1234');

        const offer1 = await createOffer(manager, {
            propertyType: 'house',
            category: 'sale',
            status: 'available',
            city: 'Hama',
            district: 'Center',
            coordinates: '12,12',
            areaFrom: 50,
            areaTo: 90,
            pricePerMeter: 1000,
            priceTotal: 70000,
            offerStatus: true,
            brokerName: 'Ali',
        });
        await createOffer(manager, {
            propertyType: 'apartment',
            category: 'rent',
            status: 'closed',
            city: 'Damascus',
            district: 'Midan',
            coordinates: '13,13',
            areaFrom: 80,
            areaTo: 120,
            pricePerMeter: 2000,
            priceTotal: 200000,
            offerStatus: false,
            brokerName: 'Khaled',
        });

        const createdAt = offer1.body.data.createdAt;
        const resExact = await manager.get('/api/offers?city=Hama');
        expect(resExact.body.data.items.length).toBe(1);

        const resLike = await manager.get('/api/offers?city_like=dam');
        expect(resLike.body.data.items.length).toBe(1);

        const resRange = await manager.get('/api/offers?priceTotal_min=60000&priceTotal_max=80000');
        expect(resRange.body.data.items.length).toBe(1);

        const resBool = await manager.get('/api/offers?offerStatus=false');
        expect(resBool.body.data.items.length).toBe(1);

        const resDate = await manager.get(
            `/api/offers?createdAt_min=${encodeURIComponent(createdAt)}`
        );
        expect(resDate.body.data.items.length).toBe(2);

        await createRequest(manager, {
            propertyType: 'house',
            usage: 'residential',
            status: 'open',
            priority: 'high',
            city: 'Hama',
            district: 'Center',
            minArea: 60,
            maxArea: 100,
            budget: 90000,
            brokerName: 'Ali',
        });
        await createRequest(manager, {
            propertyType: 'apartment',
            usage: 'commercial',
            status: 'closed',
            priority: 'low',
            city: 'Damascus',
            district: 'Midan',
            minArea: 100,
            maxArea: 140,
            budget: 150000,
            brokerName: 'Khaled',
        });

        const reqExact = await manager.get('/api/requests?city=Hama');
        expect(reqExact.body.data.items.length).toBe(1);

        const reqLike = await manager.get('/api/requests?city_like=dam');
        expect(reqLike.body.data.items.length).toBe(1);

        const reqRange = await manager.get('/api/requests?budget_min=80000&budget_max=100000');
        expect(reqRange.body.data.items.length).toBe(1);
    });

    it('returns pagination shape and enforces brokerId on /me', async () => {
        await createUser({
            name: 'Broker One',
            email: 'broker1@test.com',
            password: 'Pass1234',
            role: 'broker',
        });
        await createUser({
            name: 'Broker Two',
            email: 'broker2@test.com',
            password: 'Pass1234',
            role: 'broker',
        });
        const broker1 = await loginAgent('broker1@test.com', 'Pass1234');
        const broker2 = await loginAgent('broker2@test.com', 'Pass1234');

        await createOffer(broker1, {
            propertyType: 'house',
            category: 'sale',
            status: 'available',
            city: 'Hama',
            district: 'Center',
            coordinates: '',
            areaFrom: 50,
            areaTo: 90,
            pricePerMeter: 1000,
            priceTotal: 70000,
            offerStatus: true,
        });
        await createOffer(broker1, {
            propertyType: 'house',
            category: 'sale',
            status: 'available',
            city: 'Hama',
            district: 'Center',
            coordinates: '',
            areaFrom: 60,
            areaTo: 100,
            pricePerMeter: 1100,
            priceTotal: 80000,
            offerStatus: true,
        });
        await createOffer(broker2, {
            propertyType: 'house',
            category: 'sale',
            status: 'available',
            city: 'Hama',
            district: 'Center',
            coordinates: '',
            areaFrom: 70,
            areaTo: 110,
            pricePerMeter: 1200,
            priceTotal: 90000,
            offerStatus: true,
        });

        const res = await broker1.get('/api/offers/me?limit=1&page=2&city=Hama');
        expect(res.body.data).toHaveProperty('items');
        expect(res.body.data).toHaveProperty('page');
        expect(res.body.data).toHaveProperty('limit');
        expect(res.body.data).toHaveProperty('total');
        expect(res.body.data.items.length).toBe(1);
        expect(res.body.data.total).toBe(2);
    });
});
