require('dotenv').config();
const nodemailer = require('nodemailer');

const testEmail = async () => {
    console.log('Testing SMTP Connection...');
    console.log(`User: ${process.env.EMAIL_USER}`);
    
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to self to test credentials
            subject: 'Test Email from Exam Portal Debugger',
            text: 'If you see this, your SMTP credentials are working correctly!'
        });
        console.log('✅ Email Sent Successfully!');
        console.log(`Message ID: ${info.messageId}`);
    } catch (error) {
        console.error('❌ Email Failed:', error.message);
    }
};

testEmail();
