import request from 'supertest';
import app from '../app.js';
import User from '../Models/User.js';
import Offer from '../Models/Offer.js';
import RequestModel from '../Models/Request.js';
import Match from '../Models/Match.js';

type CreateUserInput = {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'manager' | 'broker';
    phone?: string;
};

export const createUser = async (input: CreateUserInput) => {
    const user = await User.create({
        name: input.name,
        email: input.email,
        password: input.password,
        role: input.role,
        phone: input.phone ?? '0000000000',
    });
    return user;
};

export const loginAgent = async (email: string, password: string) => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email, password });
    return agent;
};

export const createOffer = async (agent: request.SuperAgentTest, body: Record<string, unknown>) => {
    const res = await agent.post('/api/offers').send(body);
    return res;
};

export const createRequest = async (agent: request.SuperAgentTest, body: Record<string, unknown>) => {
    const res = await agent.post('/api/requests').send(body);
    return res;
};

export const createMatch = async (data: {
    offerId: string;
    requestId: string;
    brokerId: string;
    status?: string;
    score?: number;
}) => {
    return Match.create({
        offerId: data.offerId,
        requestId: data.requestId,
        brokerId: data.brokerId,
        status: data.status,
        score: data.score,
    });
};

export { app, Offer, RequestModel };
