const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Support both MONGODB_URI (standard) and MONGO_URI (old config)
        const dbUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/exam-system';
        console.log(`Connecting to: ${dbUri.includes('localhost') ? 'Localhost' : 'Atlas (Cloud)'}`);
        
        const conn = await mongoose.connect(dbUri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
