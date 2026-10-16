
import { Session } from '../models/Session.model.js';
import { Booking } from '../models/Booking.model.js';
import { Waitlist } from '../models/Waitlist.model.js';

// 1. Get all attendees and waitlist members for a session
export const getSessionAttendees = async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId;

    // Find the session
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found.',
        code: 'SESSION_NOT_FOUND',
      });
    }

    // Find all confirmed bookings
    const bookings = await Booking.find({
      session: sessionId,
      status: 'confirmed',
    })
      .populate('user', 'name email createdAt')
      .sort({ createdAt: 1 });

    // Find all active waitlist members
    const waitlist = await Waitlist.find({
      session: sessionId,
      status: 'active',
    })
      .populate('user', 'name email createdAt')
      .sort({ createdAt: 1 });

    // Send the session and attendee details
    return res.status(200).json({
      success: true,
      session: session,
      bookings: bookings,
      waitlist: waitlist,
      totalConfirmed: bookings.length,
      totalWaitlist: waitlist.length,
    });
  } catch (error) {
    next(error);
  }
};


// 2. Check in an attendee using their check-in code
export const checkInByCode = async (req, res, next) => {
  try {
    const code = req.body.code;
    const bypassTimeWindow = req.body.bypassTimeWindow;

    // Check if a code was entered
    if (typeof code !== 'string' || code.trim() === '') {
      return res.status(422).json({
        success: false,
        error: 'Please enter a valid 6-character check-in code.',
        code: 'INVALID_CODE_FORMAT',
      });
    }

    // Convert the code to uppercase
    const cleanCode = code.trim().toUpperCase();

    // Find the booking using the check-in code
    const booking = await Booking.findOne({
      checkInCode: cleanCode,
    })
      .populate('user', 'name email')
      .populate('session');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'No booking found for this check-in code.',
        code: 'CODE_NOT_FOUND',
      });
    }

    // Check whether the booking was cancelled
    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        error: 'Check-in is not allowed for this booking.',
        code: 'BOOKING_CANCELLED',
      });
    }

    // Check whether the attendee has already checked in
    if (booking.checkedIn) {
      return res.status(409).json({
        success: false,
        error: 'This attendee has already checked in.',
        code: 'ALREADY_CHECKED_IN',
        attendee: {
          name: booking.user.name,
          email: booking.user.email,
          checkedInAt: booking.checkedInAt,
          sessionTitle: booking.session.title,
        },
      });
    }

    // Get the session and current time
    const session = booking.session;
    const currentTime = new Date();

    // Check whether the current time is within the session
    const isWithinHour =
      currentTime >= session.startTime &&
      currentTime < session.endTime;

    // Allow check-in only during the session
    if (!isWithinHour && bypassTimeWindow !== true) {
      if (currentTime < session.startTime) {
        return res.status(400).json({
          success: false,
          error: 'Check-in is not open yet.',
          code: 'SESSION_NOT_STARTED',
          sessionTime: {
            start: session.startTime,
            end: session.endTime,
          },
        });
      }

      return res.status(400).json({
        success: false,
        error: 'The check-in time has expired.',
        code: 'SESSION_EXPIRED',
        sessionTime: {
          start: session.startTime,
          end: session.endTime,
        },
      });
    }

    // Mark the attendee as checked in
    booking.checkedIn = true;
    booking.checkedInAt = currentTime;

    await booking.save();

    // Send the successful response
    return res.status(200).json({
      success: true,
      message: `Successfully checked in ${booking.user.name}!`,
      attendee: {
        bookingId: booking._id,
        name: booking.user.name,
        email: booking.user.email,
        sessionTitle: session.title,
        sessionDate: session.date,
        sessionStartHour: session.startHour,
        startTime: session.startTime,
        endTime: session.endTime,
        checkedInAt: booking.checkedInAt,
        timeWindowBypassed: !isWithinHour && bypassTimeWindow === true,
      },
    });
  } catch (error) {
    next(error);
  }
};


// 3. Mark an attendee present or absent
export const toggleAttendeeCheckIn = async (req, res, next) => {
  try {
    const bookingId = req.params.bookingId;

    // Find the booking
    const booking = await Booking.findById(bookingId)
      .populate('user session');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found.',
        code: 'BOOKING_NOT_FOUND',
      });
    }

    // Change the attendance status
    if (booking.checkedIn) {
      booking.checkedIn = false;
      booking.checkedInAt = null;
    } else {
      booking.checkedIn = true;
      booking.checkedInAt = new Date();
    }

    // Save the changes
    await booking.save();

    // Send the updated booking
    return res.status(200).json({
      success: true,
      message: booking.checkedIn
        ? 'Marked present'
        : 'Marked absent',
      booking: booking,
    });
  } catch (error) {
    next(error);
  }
};
