import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import errorHandler from './middleware/errorHandler';

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






//Error Handler Middleware
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Gym Slot Booking API running on port ${PORT}`);
})