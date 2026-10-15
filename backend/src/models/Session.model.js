import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    date: {
      type: String, // Format: YYYY-MM-DD
      required: [true, 'Session date is required (YYYY-MM-DD)'],
      index: true,
    },
    startHour: {
      type: Number, // 0 to 23
      required: [true, 'Start hour is required (0 - 23)'],
      min: [0, 'Start hour must be between 0 and 23'],
      max: [23, 'Start hour must be between 0 and 23'],
    },
    startTime: {
      type: Date,
      required: true,
      unique: true, // "Two cannot share a start time"
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    capacity: {
      type: Number,
      default: 20,
      min: 1,
    },
    bookedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    waitlistCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    title: {
      type: String,
      default: 'Gym Workout Session',
      trim: true,
    },
    instructor: {
      type: String,
      default: 'Gym Staff',
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for seats remaining
/*
sessionSchema.virtual('seatsRemaining')
This tells Mongoose to create a virtual property named seatsRemaining.
It is not a real field stored in MongoDB.

.get() defines what happens when you read the virtual property.
For example, when you write session.seatsRemaining, Mongoose runs this getter.
*/
sessionSchema.virtual('seatsRemaining').get(function () {
  return Math.max(0, this.capacity - this.bookedCount);
});

// Virtual for status (upcoming, in-progress, completed)
sessionSchema.virtual('status').get(function () {
  const now = new Date();
  if (now < this.startTime) return 'upcoming';
  if (now >= this.startTime && now <= this.endTime) return 'in-progress';
  return 'completed';
});

export const Session = mongoose.model('Session', sessionSchema);
