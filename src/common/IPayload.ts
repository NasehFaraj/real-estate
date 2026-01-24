import { Role } from './Role.js';

export interface payload {
    id: string;
    name: string;
    email?: string;
    role: Role;
}
