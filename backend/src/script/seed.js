import { User } from '../models/User.model.js';
import { Session } from '../models/Session.model.js';
import { Booking } from '../models/Booking.model.js';
import { Waitlist } from '../models/Waitlist.model.js';
import { generateCheckInCode } from '../utils/codeGenerator.js';

export const seedInitialData = async (quiet = false) => {
  const log = (...args) => {
    if (!quiet) console.log(...args);
  };

  log('🌱 Seeding database...');

  // Clear existing collections
  await User.deleteMany({});
  await Session.deleteMany({});
  await Booking.deleteMany({});
  await Waitlist.deleteMany({});

  // 1. Create Admin Account (Created directly in DB as required by spec)
  const admin = new User({
    name: 'Gym General Manager',
    email: 'admin@gymslot.com',
    password: 'AdminPassword123!',
    role: 'admin',
  });
  await admin.save();
  log('👑 Admin created: admin@gymslot.com / AdminPassword123!');

  // 2. Create Primary Demo Members
  const amit = new User({
    name: 'amit',
    email: 'amit@example.com',
    password: 'MemberPass123!',
    role: 'member',
  });
  await amit.save();

  const mem1 = new User({
    name: 'mem1',
    email: 'mem1@example.com',
    password: 'MemberPass123!',
    role: 'member',
  });
  await mem1.save();

  const mem2 = new User({
    name: 'mem2',
    email: 'mem2@example.com',
    password: 'MemberPass123!',
    role: 'member',
  });
  await mem2.save();

  // 3. Create 25 additional mock members for populating capacities & waitlists
  const mockMembers = [];
  for (let i = 1; i <= 25; i++) {
    const member = new User({
      name: `Member ${i}`,
      email: `member${i}@gymslot.com`,
      password: 'MemberPass123!',
      role: 'member',
    });
    await member.save();
    mockMembers.push(member);
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const getDateStr = (daysAhead) => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  };

  const tomorrowStr = getDateStr(1);
  const dayAfterStr = getDateStr(2);
  const day3Str = getDateStr(3);

  const currentHour = now.getHours();

  const makeSessionTimes = (dateStr, hour) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const startTime = new Date(Date.UTC(y, m - 1, d, hour, 0, 0, 0));
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    return { startTime, endTime };
  };

  // SESSION 1: LIVE NOW (For instant check-in testing)
  const { startTime: s1Start, endTime: s1End } = makeSessionTimes(todayStr, currentHour);
  const sessionLiveNow = new Session({
    date: todayStr,
    startHour: currentHour,
    startTime: s1Start,
    endTime: s1End,
    capacity: 20,
    bookedCount: 1,
    waitlistCount: 0,
    title: 'Current Hour Workout (Active Check-in Window)',
    instructor: 'Coach Alex',
  });
  await sessionLiveNow.save();

  const liveBookingJohn = new Booking({
    session: sessionLiveNow._id,
    user: amit._id,
    status: 'confirmed',
    checkInCode: '7XKP2Q', // Matching sample in PDF!
    checkedIn: false,
  });
  await liveBookingJohn.save();

  // SESSION 2: FULL SESSION (20 booked + 2 on waitlist!)
  const { startTime: s2Start, endTime: s2End } = makeSessionTimes(tomorrowStr, 10);
  const fullSession = new Session({
    date: tomorrowStr,
    startHour: 10,
    startTime: s2Start,
    endTime: s2End,
    capacity: 20,
    bookedCount: 20,
    waitlistCount: 2,
    title: 'Peak Strength & Power (FULL - 20/20)',
    instructor: 'Coach Marcus',
  });
  await fullSession.save();

  for (let i = 0; i < 20; i++) {
    const b = new Booking({
      session: fullSession._id,
      user: mockMembers[i]._id,
      status: 'confirmed',
      checkInCode: generateCheckInCode(),
    });
    await b.save();
  }

  // Amit and mem1 on the waitlist
  const wl1 = new Waitlist({
    session: fullSession._id,
    user: amit._id,
    status: 'active',
    createdAt: new Date(Date.now() - 3600000), // Position #1
  });
  await wl1.save();

  const wl2 = new Waitlist({
    session: fullSession._id,
    user: mem1._id,
    status: 'active',
    createdAt: new Date(Date.now() - 1800000), // Position #2
  });
  await wl2.save();

  // SESSION 3: Tomorrow at 14:00 (15 booked, 5 seats remaining)
  const { startTime: s3Start, endTime: s3End } = makeSessionTimes(tomorrowStr, 14);
  const session3 = new Session({
    date: tomorrowStr,
    startHour: 14,
    startTime: s3Start,
    endTime: s3End,
    capacity: 20,
    bookedCount: 15,
    waitlistCount: 0,
    title: 'HIIT Cardio Blast',
    instructor: 'Coach Elena',
  });
  await session3.save();

  const bookingS3John = new Booking({
    session: session3._id,
    user: amit._id,
    status: 'confirmed',
    checkInCode: generateCheckInCode(),
  });
  await bookingS3John.save();

  for (let i = 0; i < 14; i++) {
    const b = new Booking({
      session: session3._id,
      user: mockMembers[i]._id,
      status: 'confirmed',
      checkInCode: generateCheckInCode(),
    });
    await b.save();
  }

  // SESSION 4: Tomorrow at 17:00 (3 booked, 17 seats remaining)
  const { startTime: s4Start, endTime: s4End } = makeSessionTimes(tomorrowStr, 17);
  const session4 = new Session({
    date: tomorrowStr,
    startHour: 17,
    startTime: s4Start,
    endTime: s4End,
    capacity: 20,
    bookedCount: 3,
    waitlistCount: 0,
    title: 'Functional Core & Mobility',
    instructor: 'Coach Sarah',
  });
  await session4.save();

  // SESSION 5: Day after tomorrow at 09:00 (0 booked, 20 seats remaining)
  const { startTime: s5Start, endTime: s5End } = makeSessionTimes(dayAfterStr, 9);
  const session5 = new Session({
    date: dayAfterStr,
    startHour: 9,
    startTime: s5Start,
    endTime: s5End,
    capacity: 20,
    bookedCount: 0,
    waitlistCount: 0,
    title: 'Morning Endurance Cycle',
    instructor: 'Coach Alex',
  });
  await session5.save();

  // SESSION 6: Day 3 at 11:00 (Open Gym)
  const { startTime: s6Start, endTime: s6End } = makeSessionTimes(day3Str, 11);
  const session6 = new Session({
    date: day3Str,
    startHour: 11,
    startTime: s6Start,
    endTime: s6End,
    capacity: 20,
    bookedCount: 5,
    waitlistCount: 0,
    title: 'Open Gym & Free Weights',
    instructor: 'Staff Support',
  });
  await session6.save();

  log('✅ Seed complete with full session, check-in window session, admin & members.');
};

// If run directly from CLI: node src/script/seed.js
if (process.argv[1]?.endsWith('seed.js')) {
  import('../config/db.js').then(async ({ connectDB, disconnectDB }) => {
    try {
      await connectDB();
      await seedInitialData(false);
      await disconnectDB();
      process.exit(0);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });
}
