import mongoose, { Schema } from 'mongoose';

export interface IMatch {
    offerId: mongoose.Types.ObjectId;
    requestId: mongoose.Types.ObjectId;
    brokerId: mongoose.Types.ObjectId;
    status?: string;
    score?: number;
}

const MatchSchema = new Schema<IMatch>(
    {
        offerId: { type: Schema.Types.ObjectId, ref: 'Offer', required: true },
        requestId: { type: Schema.Types.ObjectId, ref: 'Request', required: true },
        brokerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: { type: String },
        score: { type: Number },
    },
    { timestamps: true }
);

const Match = (mongoose.models.Match as mongoose.Model<IMatch>) || mongoose.model<IMatch>('Match', MatchSchema);

export default Match;
