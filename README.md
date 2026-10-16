# Gym Slot Booking System

A real-time, concurrency-safe gym session reservation and check-in platform designed to eliminate overbooking, manage 20-person capacity sessions, automate waitlist promotions, and streamline reception check-ins.

---

## 📐 Design Note (Stack & Data Model)

Built with React 19 + Tailwind CSS (v4) on the frontend for optimistic, responsive, and accessible UI; Node.js + Express.js for a robust REST API; and MongoDB via Mongoose for transactional consistency. The data model comprises four related collections: **Users** (members and admins with hashed bcrypt passwords), **Sessions** (date, start hour, unique start time index, and 20-seat fixed capacity), **Bookings** (session ref, user ref, partial unique index ensuring 1 confirmed booking per member, and an unguessable 6-character check-in code like `7XKP2Q`), and **Waitlists** (FIFO queue entries per session). Atomic conditional operators (`findOneAndUpdate` with `$inc` and `$lt`) guarantee that sessions never exceed 20 confirmed bookings even under simultaneous race conditions, while cancellations immediately and atomically promote the first waitlisted member before sessions commence.

---

## Test Credentials

| Role | Email | Password |
| **Admin** | `admin@gymslot.com` | `AdminPassword123!` |
| **Member 1** | `amit@example.com` | `MemberPass123!` |
| **Member 2** | `mem1@example.com` | `MemberPass123!` |

---

## 💡 Assumptions

1. **Session Timings & Duration**: As stated, each session lasts exactly 1 hour and starts on the hour. Two sessions cannot share a start time; this is strictly enforced with a unique database index on `startTime`.
2. **Session Capacity**: Fixed at 20 people per session.
3. **Admin Creation**: Admin accounts cannot be created via the public registration endpoint (`/api/auth/register`). Public registration always assigns the `member` role. Admin accounts are seeded directly in the database.
4. **Cancellation & Waitlist Promotion**: Members can cancel their booking at any point until the session starts. When a cancellation occurs:
   - If the waitlist contains members and the session has not started, the earliest waitlist member (FIFO) is automatically promoted, allocated a spot, and issued a secure check-in code without decrementing the session's booked count.
   - If no one is on the waitlist, the session's `bookedCount` decrements by 1.
   - As per specification, nobody is promoted into a session that has already started.
5. **Check-In Validation**: Check-in codes work once, cannot be used for cancelled bookings, and must occur during the session's 1-hour window. A test bypass toggle is provided in the admin UI to allow testing check-in outside exact clock hours during evaluation.
6. **Local Database Fallback**: If a standalone MongoDB instance is not detected on `mongodb://127.0.0.1:27017`, the backend automatically falls back to an embedded in-memory MongoDB (`mongodb-memory-server`) with automatic test data seeding, allowing zero-configuration local execution.

---

## 🚀 How to Run Locally

### Prerequisites

- Node.js (v18+)
- npm (v9+)

### 1. Backend Setup & Start

```bash
cd backend
npm install
npm run seed     # (Optional) Pre-seeds admin, members, full sessions, and check-in codes
npm run server        # Starts Express server on http://localhost:5000
```

### 2. Frontend Setup & Start

In a new terminal window:

```bash
cd frontend
npm install
npm run dev      # Starts Vite dev server on http://localhost:3000
```

Open your browser to: **[http://localhost:3000](http://localhost:3000)**

---
