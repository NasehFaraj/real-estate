import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app, createOffer, createUser, loginAgent } from './helpers.js';
import Offer from '../Models/Offer.js';

const offerBody = {
    propertyType: 'apartment',
    category: 'sale',
    status: 'available',
    city: 'Hama',
    district: 'Center',
    coordinates: '',
    areaFrom: 80,
    areaTo: 120,
    pricePerMeter: 1000,
    priceTotal: 100000,
    offerStatus: true,
};

describe('Offers', () => {
    it('broker creates offer with brokerName/brokerId auto-set and ignores body brokerName', async () => {
        const broker = await createUser({
            name: 'Broker One',
            email: 'broker1@test.com',
            password: 'Pass1234',
            role: 'broker',
        });
        const brokerAgent = await loginAgent('broker1@test.com', 'Pass1234');
        const res = await createOffer(brokerAgent, {
            ...offerBody,
            brokerName: 'Injected',
        });
        expect(res.status).toBe(201);
        expect(res.body.data.brokerName).toBe('Broker One');
        expect(res.body.data.brokerId).toBe(broker!._id.toString());
    });

    it('areaForm maps to areaFrom', async () => {
        await createUser({
            name: 'Broker One',
            email: 'broker1@test.com',
            password: 'Pass1234',
            role: 'broker',
        });
        const brokerAgent = await loginAgent('broker1@test.com', 'Pass1234');
        const res = await createOffer(brokerAgent, {
            ...offerBody,
            areaFrom: undefined,
            areaForm: 55,
        });
        expect(res.status).toBe(201);
        expect(res.body.data.areaFrom).toBe(55);
    });

    it('broker sees only own offers in /me', async () => {
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

        await createOffer(broker1, offerBody);
        await createOffer(broker2, { ...offerBody, city: 'Damascus' });

        const res = await broker1.get('/api/offers/me');
        expect(res.status).toBe(200);
        expect(res.body.data.items.length).toBe(1);
        expect(res.body.data.items[0].city).toBe('Hama');
    });

    it('manager can list all offers, broker cannot delete, manager can delete', async () => {
        await createUser({
            name: 'Manager',
            email: 'manager@test.com',
            password: 'Pass1234',
            role: 'manager',
        });
        await createUser({
            name: 'Broker',
            email: 'broker@test.com',
            password: 'Pass1234',
            role: 'broker',
        });

        const manager = await loginAgent('manager@test.com', 'Pass1234');
        const broker = await loginAgent('broker@test.com', 'Pass1234');

        const created = await createOffer(broker, offerBody);
        const offerId = created.body.data._id;

        const listRes = await manager.get('/api/offers');
        expect(listRes.status).toBe(200);
        expect(listRes.body.data.items.length).toBe(1);

        const brokerDel = await broker.delete(`/api/offers/${offerId}`);
        expect(brokerDel.status).toBe(403);

        const managerDel = await manager.delete(`/api/offers/${offerId}`);
        expect(managerDel.status).toBe(200);
    });

    it('list offers requires auth and forbids broker role', async () => {
        await createUser({
            name: 'Manager',
            email: 'manager2@test.com',
            password: 'Pass1234',
            role: 'manager',
        });
        await createUser({
            name: 'Broker',
            email: 'broker2@test.com',
            password: 'Pass1234',
            role: 'broker',
        });

        const anonRes = await request(app).get('/api/offers');
        expect(anonRes.status).toBe(401);

        const broker = await loginAgent('broker2@test.com', 'Pass1234');
        const brokerRes = await broker.get('/api/offers');
        expect(brokerRes.status).toBe(403);
    });

    it('broker can read own offer and cannot read others', async () => {
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

        const offer1 = await createOffer(broker1, offerBody);
        const offer2 = await createOffer(broker2, { ...offerBody, city: 'Damascus' });

        const okRes = await broker1.get(`/api/offers/${offer1.body.data._id}`);
        expect(okRes.status).toBe(200);

        const forbidRes = await broker1.get(`/api/offers/${offer2.body.data._id}`);
        expect(forbidRes.status).toBe(403);
    });
});
