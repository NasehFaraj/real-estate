export enum Role {
    ADMIN = 'admin',
    MANAGER = 'manager',
    BROKER = 'broker',
}

export const normalizeRole = (value: unknown): Role | null => {
    if (typeof value !== 'string') return null;
    const normalized = value.toLowerCase();
    if (normalized === Role.ADMIN) return Role.ADMIN;
    if (normalized === Role.MANAGER) return Role.MANAGER;
    if (normalized === Role.BROKER) return Role.BROKER;
    return null;
};
