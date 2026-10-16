import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import errorHandler from './middleware/errorHandler';
import { connectDB } from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import waitlistRoutes from './routes/waitlistRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

//Middleware
app.use(cors({
    origin: '*'
}))
app.use(express.json());



//Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toLocaleString('en-IN'),
        service: 'Gym Slot Booking API',
    })
});

//Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/admin', adminRoutes);






//Error Handler Middleware
app.use(errorHandler);


await connectDB();

// Auto-seed initial test dataset if empty
const { User } = await import('./models/User.js');
const userCount = await User.countDocuments();
if (userCount === 0) {
    console.log('⚡ Empty database detected. Auto-seeding initial test dataset...');
    const { seedInitialData } = await import('./scripts/seed.js');
    await seedInitialData(false);
}

app.listen(PORT, () => {
    console.log(`Gym Slot Booking API running on port ${PORT}`);
})