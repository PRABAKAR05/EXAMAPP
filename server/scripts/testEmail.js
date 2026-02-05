const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const nodemailer = require('nodemailer');

const testEmail = async () => {
    console.log('--- Email Test Script ---');
    console.log('User:', process.env.EMAIL_USER);
    // Hide password for log
    console.log('Pass:', process.env.EMAIL_PASS ? '******' : 'MISSING'); 

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('ERROR: Missing Credentials in .env');
        return;
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        console.log('Transporter created. Verifying connection...');
        await transporter.verify();
        console.log('Connection Verified! Ready to send.');

        console.log('Attempting to send test email...');
        const info = await transporter.sendMail({
            from: `Test Script <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Send to self
            subject: 'Test Email from Exam App',
            html: '<h1>It Works!</h1><p>This is a test email to verify credentials.</p>'
        });

        console.log('Email Sent Successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('FATAL ERROR:', error);
    }
};

testEmail();
