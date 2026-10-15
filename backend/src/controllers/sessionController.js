import { Session } from '../models/Session.js';
import { Booking } from '../models/Booking.js';
import { Waitlist } from '../models/Waitlist.js';

export const createSession = async (req, res, next) => {
  try {
    const { date, startHour, title, instructor } = req.body;

    if (!date || startHour === undefined || startHour === null) {
      return res.status(422).json({
        success: false,
        error: 'Both session date (YYYY-MM-DD) and startHour (0-23) are required.',
        code: 'MISSING_SESSION_DATA',
      });
    }

    // Validate date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(422).json({
        success: false,
        error: 'Invalid date format. Expected YYYY-MM-DD.',
        code: 'INVALID_DATE_FORMAT',
      });
    }

    const hourNum = parseInt(startHour, 10);
    if (isNaN(hourNum) || hourNum < 0 || hourNum > 23) {
      return res.status(422).json({
        success: false,
        error: 'Start hour must be an integer between 0 and 23.',
        code: 'INVALID_START_HOUR',
      });
    }

    // Construct start and end dates (using ISO UTC representation for consistency)
    const [year, month, day] = date.split('-').map(Number);
    const startTime = new Date(Date.UTC(year, month - 1, day, hourNum, 0, 0, 0));
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

    // "Sessions start on the hour and last one hour. Two cannot share a start time."
    const existingSession = await Session.findOne({ startTime });
    if (existingSession) {
      return res.status(409).json({
        success: false,
        error: `A session already exists at ${date} starting at ${String(hourNum).padStart(2, '0')}:00.`,
        code: 'SESSION_TIME_COLLISION',
      });
    }

    const session = new Session({
      date,
      startHour: hourNum,
      startTime,
      endTime,
      capacity: 20, // fixed to 20 as per specification
      bookedCount: 0,
      waitlistCount: 0,
      title: title?.trim() || 'Gym Workout Session',
      instructor: instructor?.trim() || 'Gym Staff',
    });

    await session.save();

    return res.status(201).json({
      success: true,
      message: 'Session created successfully',
      session,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'A session already exists with this start time.',
        code: 'SESSION_TIME_COLLISION',
      });
    }
    next(err);
  }
};

export const getSessions = async (req, res, next) => {
  try {
    const { date, includePast } = req.query;
    const filter = {};

    if (date) {
      filter.date = date;
    }

    if (includePast !== 'true') {
      // By default show sessions that haven't ended yet or from today onwards
      // Filter out sessions whose endTime is in the past unless explicitly requested
      // filter.endTime = { $gte: new Date() };
    }

    const sessions = await Session.find(filter).sort({ startTime: 1 });

    const userId = req.user ? req.user._id : null;

    // Attach user-specific booking and waitlist statuses if user is authenticated
    let userBookingsMap = new Map();
    let userWaitlistMap = new Map();

    if (userId) {
      const myBookings = await Booking.find({
        user: userId,
        status: 'confirmed',
      });
      myBookings.forEach((b) => {
        userBookingsMap.set(b.session.toString(), b);
      });

      const myWaitlists = await Waitlist.find({
        user: userId,
        status: 'active',
      });
      myWaitlists.forEach((w) => {
        userWaitlistMap.set(w.session.toString(), w);
      });
    }

    // Map sessions to enrich with remaining seats and user state
    const enrichedSessions = await Promise.all(
      sessions.map(async (sess) => {
        const sessObj = sess.toJSON();
        const myBooking = userBookingsMap.get(sess._id.toString());
        const myWaitlist = userWaitlistMap.get(sess._id.toString());

        sessObj.isBookedByMe = !!myBooking;
        sessObj.myBookingId = myBooking ? myBooking._id : null;
        sessObj.myCheckInCode = myBooking ? myBooking.checkInCode : null;
        sessObj.myCheckedIn = myBooking ? myBooking.checkedIn : false;

        sessObj.isWaitlistedByMe = !!myWaitlist;
        sessObj.myWaitlistId = myWaitlist ? myWaitlist._id : null;

        if (myWaitlist) {
          // Calculate waitlist position
          const aheadCount = await Waitlist.countDocuments({
            session: sess._id,
            status: 'active',
            createdAt: { $lt: myWaitlist.createdAt },
          });
          sessObj.myWaitlistPosition = aheadCount + 1;
        }

        return sessObj;
      })
    );

    return res.status(200).json({
      success: true,
      count: enrichedSessions.length,
      sessions: enrichedSessions,
    });
  } catch (err) {
    next(err);
  }
};

export const getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found.',
        code: 'SESSION_NOT_FOUND',
      });
    }

    const sessObj = session.toJSON();

    if (req.user && req.user.role === 'admin') {
      // Admin sees all bookings and waitlist
      const bookings = await Booking.find({ session: id, status: 'confirmed' })
        .populate('user', 'name email')
        .sort({ createdAt: 1 });

      const waitlist = await Waitlist.find({ session: id, status: 'active' })
        .populate('user', 'name email')
        .sort({ createdAt: 1 });

      sessObj.bookings = bookings;
      sessObj.waitlist = waitlist;
    }

    return res.status(200).json({
      success: true,
      session: sessObj,
    });
  } catch (err) {
    next(err);
  }
};
