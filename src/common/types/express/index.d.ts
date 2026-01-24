import type { payload } from '../../IPayload.js';
import type { IUser } from '../../../Models/User.js';

declare global {
    namespace Express {
        interface Request {
            payload?: payload;
            user?: IUser;
            requestId?: string;
        }
    }
}

export {};
