import mongoose, { Schema } from 'mongoose';

export interface IOffer {
    propertyType: string;
    category: string;
    status: string;
    city: string;
    district: string;
    coordinates?: string;
    areaFrom: number;
    areaTo: number;
    pricePerMeter: number;
    priceTotal: number;
    offerStatus: boolean;
    brokerName: string;
    brokerId?: mongoose.Types.ObjectId;
}

const OfferSchema = new Schema<IOffer>(
    {
        propertyType: { type: String, required: true },
        category: { type: String, required: true },
        status: { type: String, required: true },
        city: { type: String, required: true },
        district: { type: String, required: true },
        coordinates: { type: String, default: '' },
        areaFrom: { type: Number, required: true },
        areaTo: { type: Number, required: true },
        pricePerMeter: { type: Number, required: true },
        priceTotal: { type: Number, required: true },
        offerStatus: { type: Boolean, required: true, default: true },
        brokerName: { type: String, default: '' },
        brokerId: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

const Offer =
    (mongoose.models.Offer as mongoose.Model<IOffer>) ||
    mongoose.model<IOffer>('Offer', OfferSchema);

export default Offer;
