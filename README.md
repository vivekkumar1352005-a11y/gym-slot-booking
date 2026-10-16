# Gym Slot Booking System

A real-time, concurrency-safe gym session reservation and check-in platform designed to eliminate overbooking, manage 20-person capacity sessions, automate waitlist promotions, and streamline reception check-ins.

---

## 📐 Design Note (Stack & Data Model)

Built with React 19 + Tailwind CSS (v4) on the frontend for optimistic, responsive, and accessible UI; Node.js + Express.js for a robust REST API; and MongoDB via Mongoose for transactional consistency. The data model comprises four related collections: **Users** (members and admins with hashed bcrypt passwords), **Sessions** (date, start hour, unique start time index, and 20-seat fixed capacity), **Bookings** (session ref, user ref, partial unique index ensuring 1 confirmed booking per member, and an unguessable 6-character check-in code like `7XKP2Q`), and **Waitlists** (FIFO queue entries per session). Atomic conditional operators (`findOneAndUpdate` with `$inc` and `$lt`) guarantee that sessions never exceed 20 confirmed bookings even under simultaneous race conditions, while cancellations immediately and atomically promote the first waitlisted member before sessions commence.

## Test Credentials

| Role | Email | Password |
| **Admin** | `admin@gymslot.com` | `AdminPassword123!` |
| **Member 1** | `amit@example.com` | `MemberPass123!` |
| **Member 2** | `mem1@example.com` | `MemberPass123!` |
