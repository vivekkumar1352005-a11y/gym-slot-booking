
import { Session } from '../models/Session.model.js';
import { Booking } from '../models/Booking.model.js';
import { Waitlist } from '../models/Waitlist.model.js';

// 1. Join the waitlist
export const joinWaitlist = async (req, res, next) => {
  try {
    const sessionId = req.body.sessionId;
    const userId = req.user._id;

    // Check session ID
    if (!sessionId) {
      return res.status(422).json({
        success: false,
        error: 'Session ID is required.',
        code: 'MISSING_SESSION_ID',
      });
    }

    // Find the session
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found.',
        code: 'SESSION_NOT_FOUND',
      });
    }

    // Check if the session has started
    if (session.startTime <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Session has already started.',
        code: 'SESSION_ALREADY_STARTED',
      });
    }

    // Check if the session is full
    if (session.bookedCount < session.capacity) {
      return res.status(400).json({
        success: false,
        error: 'Seats are available. Please book the session.',
        code: 'SESSION_NOT_FULL',
      });
    }

    // Check if the user already has a booking
    const booking = await Booking.findOne({
      session: sessionId,
      user: userId,
      status: 'confirmed',
    });

    if (booking) {
      return res.status(409).json({
        success: false,
        error: 'You have already booked this session.',
        code: 'ALREADY_BOOKED',
      });
    }

    // Check if the user is already on the waitlist
    const oldWaitlist = await Waitlist.findOne({
      session: sessionId,
      user: userId,
      status: 'active',
    });

    if (oldWaitlist) {
      return res.status(409).json({
        success: false,
        error: 'You are already on the waitlist.',
        code: 'ALREADY_WAITLISTED',
      });
    }

    // Add the user to the waitlist
    const waitlist = new Waitlist({
      session: sessionId,
      user: userId,
      status: 'active',
    });

    await waitlist.save();

    // Increase the waitlist count
    session.waitlistCount = session.waitlistCount + 1;
    await session.save();

    // Calculate the user's position
    const peopleAhead = await Waitlist.countDocuments({
      session: sessionId,
      status: 'active',
      createdAt: { $lt: waitlist.createdAt },
    });

    return res.status(201).json({
      success: true,
      message: 'Successfully joined the waitlist!',
      waitlist: waitlist,
      position: peopleAhead + 1,
    });
  } catch (error) {
    // Handle duplicate waitlist entries
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'You are already on the waitlist.',
        code: 'ALREADY_WAITLISTED',
      });
    }

    next(error);
  }
};


// 2. Leave the waitlist
export const leaveWaitlist = async (req, res, next) => {
  try {
    const waitlistId = req.params.id;
    const userId = req.user._id;

    // Find the waitlist entry
    const waitlist = await Waitlist.findById(waitlistId);

    if (!waitlist) {
      return res.status(404).json({
        success: false,
        error: 'Waitlist entry not found.',
        code: 'WAITLIST_NOT_FOUND',
      });
    }

    // Check whether the user owns this entry
    if (
      req.user.role !== 'admin' &&
      waitlist.user.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        error: 'You can only leave your own waitlist.',
        code: 'FORBIDDEN',
      });
    }

    // Check whether the entry is active
    if (waitlist.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'This waitlist entry is not active.',
        code: 'INVALID_WAITLIST_STATUS',
      });
    }

    // Mark the entry as left
    waitlist.status = 'left';
    waitlist.leftAt = new Date();

    await waitlist.save();

    // Decrease the waitlist count
    await Session.updateOne(
      {
        _id: waitlist.session,
        waitlistCount: { $gt: 0 },
      },
      {
        $inc: { waitlistCount: -1 },
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Successfully left the waitlist.',
      waitlist: waitlist,
    });
  } catch (error) {
    next(error);
  }
};
