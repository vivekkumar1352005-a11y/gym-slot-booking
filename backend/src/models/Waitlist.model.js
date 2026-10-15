import mongoose from 'mongoose';

const waitlistSchema = new mongoose.Schema(
    {
        session: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Session',
            required: [true, 'Session ID is required'],
            index: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        status: {
            type: String,
            enum: ['active', 'left', 'promoted'],
            default: 'active',
            index: true,
        },
        promotedAt: {
            type: Date,
            default: null,
        },
        leftAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

//Prevent being on active waitlist twice for same session
waitlistSchema.index(
    { session: 1 , user: 1 },
    {
        unique: true,
        partialFilterExpression: { status: 'active'},
    }
);

export const Waitlist = mongoose.model('Waitlist', waitlistSchema);