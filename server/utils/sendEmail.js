const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const sendEmail = async (options) => {
    const logPath = path.join(process.cwd(), 'mail_log.txt');
    const log = (msg) => fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);

    try {
        log(`Preparing to send email to: ${options.to}`);
        
        // 1) Create a transporter
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // 2) Define the email options
        const mailOptions = {
            from: `Exam Portal Admin <${process.env.EMAIL_USER}>`,
            to: options.to,
            replyTo: options.replyTo,
            cc: options.cc,
            // Always BCC the sender (admin) for verification during debug
            bcc: process.env.EMAIL_USER, 
            subject: options.subject,
            html: options.html
        };

        log(`Transporter ready. Sending...`);

        // 3) Actually send the email
        const info = await transporter.sendMail(mailOptions);
        log(`SUCCESS. MessageId: ${info.messageId}`);
        log(`Response: ${info.response}`);

    } catch (error) {
        fs.appendFileSync(path.join(process.cwd(), 'mail_log.txt'), `[${new Date().toISOString()}] EMAIL ERROR: ${error.message}\n${error.stack}\n`);
        throw error;
    }
};

module.exports = sendEmail;
