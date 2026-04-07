import mongoose, { Schema, type HydratedDocument } from 'mongoose';
import bcrypt from 'bcrypt';
import { Role } from '../common/Role.js';

export interface IUser {
    name: string;
    phone: string;
    email: string;
    role: Role;
    password: string;
}

const UserSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        role: {
            type: String,
            enum: [Role.ADMIN, Role.MANAGER, Role.BROKER],
            default: Role.BROKER,
            required: true,
        },
        password: { type: String, required: true },
    },
    { timestamps: true }
);

UserSchema.pre('save', async function (this: HydratedDocument<IUser>) {
    if (!this.isModified('password')) return;
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
});

const User =
    (mongoose.models.User as mongoose.Model<IUser>) || mongoose.model<IUser>('User', UserSchema);

export default User;
