import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
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
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
      index: true,
    },
    checkInCode: {
      type: String,
      uppercase: true,
      trim: true,
    },
    checkedIn: {
      type: Boolean,
      default: false,
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent multiple confirmed bookings for the same member & session
// Allows rebooking after cancellation because cancelled bookings don't collide
bookingSchema.index(
  { session: 1, user: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'confirmed' },
  }
);

// Index on checkInCode for fast lookups
bookingSchema.index(
  { checkInCode: 1 },
  {
    unique: true,
    sparse: true,
  }
);

export const Booking = mongoose.model('Booking', bookingSchema);
