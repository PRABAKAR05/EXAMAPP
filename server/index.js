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
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.CLIENT_URL // Production frontend URL (Vercel)
].filter(Boolean);

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (Postman, mobile apps)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/classes', classRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Online Exam System API' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // AUTO-DIAGNOSE ON STARTUP (Run only once in production)
    if (process.env.NODE_ENV === 'production' || process.env.MONGODB_URI) {
        console.log('Running DB Diagnostic...');
        const { exec } = require('child_process');
        exec('node diagnose_db.js', (error, stdout, stderr) => {
            if (error) console.error(`Diagnostic Error: ${error}`);
            if (stderr) console.error(`Diagnostic Stderr: ${stderr}`);
            if (stdout) console.log(stdout); // This will print to Render logs
        });
    }
});

