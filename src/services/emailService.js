const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD, //using a gmail app password here
    },
});

async function sendOtp(toEmail, otp) {
    await transporter.sendMail({
        from: `"IzzyRoots" <${process.env.MAIL_USERNAME}>`,
        to: toEmail,
        subject: 'Your IzzyRoots Verification Code',
        text:
        `Hi there!\n\n` +
      `Your verification code is: ${otp}\n\n` +
      `This code expires in 15 minutes.\n\n` +
      `If you did not create an account, please ignore this email.\n\n` +
      `– The Izzy Roots Team`,
    });
}

module.exports = { sendOtp };