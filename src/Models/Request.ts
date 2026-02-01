import mongoose, { Schema } from 'mongoose';

export interface IRequest {
    propertyType: string;
    usage: string;
    status: string;
    priority: string;
    city: string;
    district: string;
    minArea: number;
    maxArea: number;
    budget: number;
    brokerName: string;
    brokerId?: mongoose.Types.ObjectId;
}

const RequestSchema = new Schema<IRequest>(
    {
        propertyType: { type: String, required: true },
        usage: { type: String, required: true },
        status: { type: String, required: true },
        priority: { type: String, required: true },
        city: { type: String, required: true },
        district: { type: String, required: true },
        minArea: { type: Number, required: true },
        maxArea: { type: Number, required: true },
        budget: { type: Number, required: true },
        brokerName: { type: String, default: '' },
        brokerId: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

const Request = (mongoose.models.Request as mongoose.Model<IRequest>) || mongoose.model<IRequest>('Request', RequestSchema);

export default Request;
