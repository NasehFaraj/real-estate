import { Types } from 'mongoose';
import User from '../Models/User.js';
import { Role, normalizeRole } from '../common/Role.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isEmail, isNonEmptyString } from '../utils/validators.js';

export const createUser = asyncHandler(async (req, res) => {
    const { name, phone, email, password, role } = req.body as {
        name?: string;
        phone?: string;
        email?: string;
        password?: string;
        role?: string;
    };

    if (
        !isNonEmptyString(name) ||
        !isNonEmptyString(phone) ||
        !isEmail(email) ||
        !isNonEmptyString(password) ||
        !isNonEmptyString(role)
    ) {
        res.status(400).json({ success: false, message: 'بيانات غير صالحة' });
        return;
    }

    const parsedRole = normalizeRole(role);
    if (parsedRole !== Role.MANAGER && parsedRole !== Role.BROKER) {
        res.status(400).json({ success: false, message: 'الدور غير صالح' });
        return;
    }

    const user = await User.create({ name, phone, email, password, role: parsedRole });
    const userObj = user.toObject();
    delete (userObj as { password?: string }).password;

    res.status(201).json({ success: true, message: 'تم إنشاء المستخدم بنجاح', data: userObj });
});

export const listUsers = asyncHandler(async (_req, res) => {
    const users = await User.find().select('-password').lean();
    res.json({ success: true, message: 'تم جلب البيانات بنجاح', data: users });
});

export const deleteUser = asyncHandler(async (req, res) => {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    if (!id || !Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'معرف غير صالح' });
        return;
    }

    const deleted = await User.findByIdAndDelete(id).select('-password').lean();
    if (!deleted) {
        res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        return;
    }

    res.json({ success: true, message: 'تم الحذف بنجاح' });
});
