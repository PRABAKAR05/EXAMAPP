require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');
const classRoutes = require('./routes/classRoutes');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
try {
connectDB();
} catch (error) {
    console.error('Failed to connect', error);
}

// Middleware
app.use(helmet());
app.use(compression());

// CORS - Allow local development and production
// CORS - Allow local development and production
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.CLIENT_URL
].filter(Boolean).map(url => url ? url.replace(/\/$/, '') : '');

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (Postman, mobile apps)
        if (!origin) return callback(null, true);
        
        // Dynamic Check: Allow any Vercel deployment or Localhost
        if (
            allowedOrigins.indexOf(origin) !== -1 || 
            origin.endsWith('.vercel.app') || 
            origin.includes('localhost')
        ) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
}));

app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/classes', classRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

