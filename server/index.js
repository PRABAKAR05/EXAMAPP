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
app.use(cors()); // Allow all origins for local development
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
});

