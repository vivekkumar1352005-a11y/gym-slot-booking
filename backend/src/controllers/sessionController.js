
import { Session } from '../models/Session.js';
import { Booking } from '../models/Booking.js';
import { Waitlist } from '../models/Waitlist.js';

// 1. Create a new session
export const createSession = async (req, res, next) => {
  try {
    const { date, startHour, title, instructor } = req.body;

    // Check if date and startHour are provided
    if (!date || startHour === undefined || startHour === null) {
      return res.status(422).json({
        success: false,
        error: 'Date and startHour are required.',
        code: 'MISSING_SESSION_DATA',
      });
    }

    // Check date format: YYYY-MM-DD
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!datePattern.test(date)) {
      return res.status(422).json({
        success: false,
        error: 'Date must be in YYYY-MM-DD format.',
        code: 'INVALID_DATE_FORMAT',
      });
    }

    // Convert startHour to a number
    const hour = Number(startHour);

    // Check that the hour is a whole number from 0 to 23
    if (
      !Number.isInteger(hour) ||
      hour < 0 ||
      hour > 23
    ) {
      return res.status(422).json({
        success: false,
        error: 'Start hour must be between 0 and 23.',
        code: 'INVALID_START_HOUR',
      });
    }

    // Check that the date is a real calendar date
    const [year, month, day] = date.split('-').map(Number);

    const checkDate = new Date(Date.UTC(year, month - 1, day));

    if (
      checkDate.getUTCFullYear() !== year ||
      checkDate.getUTCMonth() !== month - 1 ||
      checkDate.getUTCDate() !== day
    ) {
      return res.status(422).json({
        success: false,
        error: 'Please enter a valid date.',
        code: 'INVALID_DATE',
      });
    }

    // Create the session start time
    const startTime = new Date(
      Date.UTC(year, month - 1, day, hour)
    );

    // The session lasts one hour
    const endTime = new Date(
      startTime.getTime() + 60 * 60 * 1000
    );

    // Check if another session starts at the same time
    const existingSession = await Session.findOne({
      startTime: startTime,
    });

    if (existingSession) {
      return res.status(409).json({
        success: false,
        error: 'A session already exists at this time.',
        code: 'SESSION_TIME_COLLISION',
      });
    }

    // Create the session object
    const session = new Session({
      date: date,
      startHour: hour,
      startTime: startTime,
      endTime: endTime,
      capacity: 20,
      bookedCount: 0,
      waitlistCount: 0,
      title: title?.trim() || 'Gym Workout Session',
      instructor: instructor?.trim() || 'Gym Staff',
    });

    // Save the session in the database
    await session.save();

    return res.status(201).json({
      success: true,
      message: 'Session created successfully.',
      session: session,
    });
  } catch (error) {
    // Handle duplicate session errors
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'A session already exists at this time.',
        code: 'SESSION_TIME_COLLISION',
      });
    }

    next(error);
  }
};


// 2. Get all sessions
export const getSessions = async (req, res, next) => {
  try {
    const { date, includePast } = req.query;

    // Create a filter for the database
    const filter = {};

    if (date) {
      filter.date = date;
    }

    // Hide sessions that have already ended by default
    if (includePast !== 'true') {
      filter.endTime = { $gte: new Date() };
    }

    // Get sessions from the database
    const sessions = await Session.find(filter).sort({
      startTime: 1,
    });

    // Get the logged-in user's ID
    const userId = req.user ? req.user._id : null;

    const myBookings = new Map();
    const myWaitlists = new Map();

    // Get this user's bookings and waitlist entries
    if (userId) {
      const bookings = await Booking.find({
        user: userId,
        status: 'confirmed',
      });

      for (const booking of bookings) {
        myBookings.set(booking.session.toString(), booking);
      }

      const waitlists = await Waitlist.find({
        user: userId,
        status: 'active',
      });

      for (const waitlist of waitlists) {
        myWaitlists.set(waitlist.session.toString(), waitlist);
      }
    }

    // Add booking and waitlist information to each session
    const sessionList = [];

    for (const session of sessions) {
      const sessionData = session.toJSON();

      const booking = myBookings.get(session._id.toString());
      const waitlist = myWaitlists.get(session._id.toString());

      sessionData.isBookedByMe = Boolean(booking);
      sessionData.myBookingId = booking ? booking._id : null;
      sessionData.myCheckInCode = booking
        ? booking.checkInCode
        : null;
      sessionData.myCheckedIn = booking
        ? booking.checkedIn
        : false;

      sessionData.isWaitlistedByMe = Boolean(waitlist);
      sessionData.myWaitlistId = waitlist
        ? waitlist._id
        : null;

      // Find the user's position in the waitlist
      if (waitlist) {
        const peopleAhead = await Waitlist.countDocuments({
          session: session._id,
          status: 'active',
          createdAt: { $lt: waitlist.createdAt },
        });

        sessionData.myWaitlistPosition = peopleAhead + 1;
      }

      sessionList.push(sessionData);
    }

    return res.status(200).json({
      success: true,
      count: sessionList.length,
      sessions: sessionList,
    });
  } catch (error) {
    next(error);
  }
};


// 3. Get one session by ID
export const getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the session using its ID
    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found.',
        code: 'SESSION_NOT_FOUND',
      });
    }

    const sessionData = session.toJSON();

    // If the logged-in user is an admin, show bookings and waitlist
    if (req.user && req.user.role === 'admin') {
      const bookings = await Booking.find({
        session: id,
        status: 'confirmed',
      })
        .populate('user', 'name email')
        .sort({ createdAt: 1 });

      const waitlist = await Waitlist.find({
        session: id,
        status: 'active',
      })
        .populate('user', 'name email')
        .sort({ createdAt: 1 });

      sessionData.bookings = bookings;
      sessionData.waitlist = waitlist;
    }

    return res.status(200).json({
      success: true,
      session: sessionData,
    });
  } catch (error) {
    next(error);
  }
};
