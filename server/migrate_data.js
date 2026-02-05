const mongoose = require('mongoose');
const User = require('./models/User');
const Class = require('./models/Class');
const Exam = require('./models/Exam');

// Configuration
const SOURCE_URI = 'mongodb://127.0.0.1:27017/exam_app';
// Cloud URI (Decoded for connection)
const DEST_URI = 'mongodb+srv://todoUser:Praba%400503@cluster0.guaqk7b.mongodb.net/exam_app?retryWrites=true&w=majority';

const migrate = async () => {
    let sourceData = {};

    try {
        // 1. READ FROM SOURCE (LOCAL)
        console.log('--- PHASE 1: READING LOCAL DATA ---');
        console.log(`Connecting to Local: ${SOURCE_URI}`);
        await mongoose.connect(SOURCE_URI);
        
        console.log('Fetching Users...');
        sourceData.users = await User.find({});
        console.log(`Found ${sourceData.users.length} users.`);

        console.log('Fetching Classes...');
        sourceData.classes = await Class.find({});
        console.log(`Found ${sourceData.classes.length} classes.`);

        console.log('Fetching Exams...');
        sourceData.exams = await Exam.find({});
        console.log(`Found ${sourceData.exams.length} exams.`);

        await mongoose.disconnect();
        console.log('Disconnected from Local.');

        // 2. WRITE TO DESTINATION (CLOUD)
        console.log('\n--- PHASE 2: WRITING TO CLOUD ---');
        console.log(`Connecting to Cloud...`);
        await mongoose.connect(DEST_URI);
        console.log('Connected to Cloud.');

        // Helper to insert data
        const insertData = async (model, data, name) => {
            let count = 0;
            let errors = 0;
            for (const item of data) {
                try {
                    // Use findOneAndUpdate with upsert to avoid duplicates by _id
                    const itemObj = item.toObject();
                    delete itemObj.__v; // Remove version key
                    
                    await model.findByIdAndUpdate(itemObj._id, itemObj, { upsert: true, new: true, runValidators: false });
                    count++;
                } catch (err) {
                    console.error(`Failed to import ${name} ID ${item._id}: ${err.message}`);
                    errors++;
                }
            }
            console.log(`✅ Use imported ${count} ${name} (Errors: ${errors})`);
        };

        await insertData(User, sourceData.users, 'Users');
        await insertData(Class, sourceData.classes, 'Classes');
        await insertData(Exam, sourceData.exams, 'Exams');

        console.log('\n--- MIGRATION COMPLETE ---');
        process.exit(0);

    } catch (error) {
        console.error('Migration Fatal Error:', error);
        process.exit(1);
    }
};

migrate();
