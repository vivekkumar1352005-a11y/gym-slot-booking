
import { Session } from '../models/Session.model.js';
import { Booking } from '../models/Booking.model.js';
import { Waitlist } from '../models/Waitlist.model.js';
import { generateCheckInCode } from '../utils/codeGenerator.js';


// 1. Book a session
export const bookSession = async (req, res, next) => {
  try {
    const sessionId = req.body.sessionId;
    const userId = req.user._id;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required.',
      });
    }

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found.',
      });
    }

    if (session.startTime <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Session has already started.',
      });
    }

    // Check existing booking
    const oldBooking = await Booking.findOne({
      session: sessionId,
      user: userId,
      status: 'confirmed',
    });

    if (oldBooking) {
      return res.status(409).json({
        success: false,
        error: 'You have already booked this session.',
      });
    }

    // Check available seats
    if (session.bookedCount >= session.capacity) {
      return res.status(409).json({
        success: false,
        error: 'Session is full.',
      });
    }

    // Increase the booked seat count
    session.bookedCount++;
    await session.save();

    // Generate a check-in code
    let code = generateCheckInCode();

    while (await Booking.findOne({ checkInCode: code })) {
      code = generateCheckInCode();
    }

    // Create booking
    try {
      const booking = new Booking({
        session: sessionId,
        user: userId,
        status: 'confirmed',
        checkInCode: code,
        checkedIn: false,
      });

      await booking.save();

      // Remove the user's active waitlist entry
      await Waitlist.updateOne(
        {
          session: sessionId,
          user: userId,
          status: 'active',
        },
        {
          status: 'promoted',
          promotedAt: new Date(),
        }
      );

      return res.status(201).json({
        success: true,
        message: 'Session booked successfully.',
        booking: booking,
        seatsRemaining: session.capacity - session.bookedCount,
      });
    } catch (error) {
      // Restore the seat if booking creation fails
      session.bookedCount--;
      await session.save();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};


// 2. Cancel a booking
export const cancelBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId)
      .populate('session');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found.',
      });
    }

    // Check booking ownership
    if (
      req.user.role !== 'admin' &&
      booking.user.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        error: 'You cannot cancel another user’s booking.',
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Booking is already cancelled.',
      });
    }

    const session = booking.session;

    if (session.startTime <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Session has already started.',
      });
    }

    // Cancel the booking
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();

    // Find the first person on the waitlist
    const nextPerson = await Waitlist.findOne({
      session: session._id,
      status: 'active',
    })
      .sort({ createdAt: 1 });

    let promoted = false;

    if (nextPerson) {
      // Move the person from waitlist to booking
      nextPerson.status = 'promoted';
      nextPerson.promotedAt = new Date();
      await nextPerson.save();

      let code = generateCheckInCode();

      while (await Booking.findOne({ checkInCode: code })) {
        code = generateCheckInCode();
      }

      const newBooking = new Booking({
        session: session._id,
        user: nextPerson.user,
        status: 'confirmed',
        checkInCode: code,
        checkedIn: false,
      });

      await newBooking.save();

      session.waitlistCount = Math.max(
        0,
        session.waitlistCount - 1
      );

      promoted = true;
    } else {
      // No waitlist member, so free the seat
      session.bookedCount = Math.max(
        0,
        session.bookedCount - 1
      );
    }

    await session.save();

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully.',
      promotedMember: promoted,
      seatsRemaining: session.capacity - session.bookedCount,
    });
  } catch (error) {
    next(error);
  }
};


// 3. Get my bookings and waitlists
export const getMyBookings = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get all bookings
    const bookings = await Booking.find({
      user: userId,
    })
      .populate('session')
      .sort({ createdAt: -1 });

    // Get active waitlist entries
    const waitlists = await Waitlist.find({
      user: userId,
      status: 'active',
    })
      .populate('session')
      .sort({ createdAt: -1 });

    const result = [];

    // Calculate waitlist positions
    for (const item of waitlists) {
      const peopleAhead = await Waitlist.countDocuments({
        session: item.session._id,
        status: 'active',
        createdAt: { $lt: item.createdAt },
      });

      const data = item.toJSON();
      data.position = peopleAhead + 1;

      result.push(data);
    }

    return res.status(200).json({
      success: true,
      bookings: bookings,
      waitlists: result,
    });
  } catch (error) {
    next(error);
  }
};
